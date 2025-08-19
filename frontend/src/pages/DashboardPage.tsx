import React, { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress, Button, Grid, Card, CardContent, TextField, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Import the API service 

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false); // New state for API key

  useEffect(() => {
    const checkApiKeyStatus = async () => {
      const apiKey = await api.get('/admin/settings/openai/key');
      setHasApiKey(!!apiKey);
    };

    const fetchData = async () => {
      try {
        // Mock data fetching
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    checkApiKeyStatus(); // Check API key status on component mount
    fetchData();
  }, []);

  const handleSendMessage = async () => {
    const messageText = inputValue.trim();
    if (messageText === '') return;

    const newUserMessage: Message = {
      id: messages.length + 1,
      text: messageText,
      sender: 'user',
    };

    // Optimistically add user message
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue('');

    // Add a placeholder for the bot's response
    const botPlaceholderMessage: Message = {
      id: messages.length + 2,
      text: '...', // Placeholder text
      sender: 'bot',
    };
    setMessages((prevMessages) => [...prevMessages, botPlaceholderMessage]);

    try {
      const token = localStorage.getItem('jwtToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/chat/openai?message=${encodeURIComponent(messageText)}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
          throw new Error('Failed to get readable stream reader.');
      }
      const decoder = new TextDecoder('utf-8');
      let finished = false;
      let lastMessageBuff = '';
      while (!finished) {
        const { done, value } = await reader.read();
        if (done) {
          finished = true;
          break;
        }
        const ret = decoder.decode(value, { stream: true });
        const lines = ret.split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5);
            // Handle the special case for '[DONE]' to finish the response
            if (data === '[DONE]') {
              finished = true;
              break;
            }
            if (data) {
              lastMessageBuff += data;

              setMessages((prevMessages) => {
                    const newMessages = [...prevMessages];
                    const lastMessageIndex = newMessages.findIndex(msg => msg.id === botPlaceholderMessage.id);
                    if (lastMessageIndex !== -1) {
                      const lastMessage = newMessages[lastMessageIndex];
                      if (lastMessage.text === '...') {
                        lastMessage.text = '';
                      }
                      lastMessage.text = lastMessageBuff;
                    }
                    return newMessages;
                  });
            }
          }
        }
      }

    } catch (err: unknown) {
      console.error('Error during chat:', err);
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage && lastMessage.sender === 'bot' && lastMessage.id === botPlaceholderMessage.id) {
          return prevMessages.map((msg, index) =>
            index === prevMessages.length - 1 ? { ...msg, text: 'Error: Could not get a response from AI.' } : msg
          );
        } else {
          return [...prevMessages, { id: Date.now(), text: 'Error: Could not get a response from AI.', sender: 'bot' }];
        }
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3, position: 'relative' }}>
        <Typography variant="h5" gutterBottom>
          Chat
        </Typography>
        {!hasApiKey && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
              borderRadius: 1,
            }}
          >
            <Typography variant="h6" color="textSecondary" align="center" sx={{ mb: 2 }}>
              API Key not set. Please configure your API key to enable chat.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/settings')} sx={{ mt: 2 }}>
              Go to Settings
            </Button>
          </Box>
        )}
        <Box sx={{ height: 300, overflowY: 'auto', mb: 2, p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                textAlign: msg.sender === 'user' ? 'right' : 'left',
                mb: 1,
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  display: 'inline-block',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: msg.sender === 'user' ? 'primary.main' : 'grey.300',
                  color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                }}
              >
                {msg.text}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            disabled={!hasApiKey} // Disable input if no API key
          />
          <Button variant="contained" onClick={handleSendMessage} sx={{ ml: 1 }} disabled={!hasApiKey}>
            Send
          </Button>
        </Box>
      </Paper>

      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        <Grid item>
          <Button variant="contained" onClick={() => navigate('/users')}>User Management</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={() => navigate('/tools')}>Tool Management</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={() => navigate('/resources')}>Resource Management</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={() => navigate('/prompts')}>Prompt Management</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={() => navigate('/settings')}>System Settings</Button>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        MCP Server Usage Guide
      </Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="body1" gutterBottom>
            The MCP Server acts as the central hub for managing and executing your custom tools, resources, and prompts. It exposes a set of RESTful APIs for programmatic interaction, and a Python SDK is available for simplified client-side development.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Key Server Endpoints (<code>/mcp-server</code> prefix):
          </Typography>
          <Typography component="div" variant="body2">
            <ul>
              <li><code>/health</code> (GET): Check the server's operational status.</li>
              <li><code>/info</code> (GET): Retrieve server application details (name, version, uptime).</li>
              <li><code>/execute-by-name</code> (POST): Execute a registered tool by its unique name.</li>
              <li><code>/tools/all</code> (GET): List all available tools with pagination support.</li>
              <li><code>/settings/all</code> (GET): Access system-wide configuration settings.</li>
              <li><code>/status/initialized</code> (GET): Verify if the system has been initialized with a user.</li>
            </ul>
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Interacting with the Server:
          </Typography>
          <Typography component="div" variant="body2">
            <ul>
              <li><b>Authentication:</b> Currently, most API endpoints do not require authentication. However, the server provides <code>/user/register</code> and <code>/user/login</code> endpoints for user management. Future updates may introduce enforced authentication for all API interactions.</li>
              <li><b>Tool Execution:</b> Tools can be executed by name, allowing dynamic invocation of custom logic.</li>
              <li><b>Data Management:</b> The server provides endpoints for managing various entities like tools, resources, and prompts, often supporting pagination for large datasets.</li>
            </ul>
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Python SDK Client:
          </Typography>
          <Typography variant="body1" gutterBottom>
            The <code>python-sdk</code> simplifies interaction with the MCP Server. The <code>Session</code> class within the SDK provides a high-level interface to:
          </Typography>
          <Typography component="div" variant="body2">
            <ul>
              <li>Interact with the server's APIs.</li>
              <li>Call registered tools.</li>
              <li>Manage resources and prompts.</li>
              <li>Handle streaming responses (e.g., for long-running operations).</li>
            </ul>
          </Typography>
          <Typography variant="body1" gutterBottom>
            <b>Example (Conceptual Python SDK Usage):</b>
          </Typography>
          <Box sx={{ bgcolor: '#f0f0f0', p: 2, borderRadius: 1, overflowX: 'auto' }}>
            <Typography component="pre" variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {`from mcp.client.session import Session
from mcp.client.auth import Auth

# Assuming server is running at http://localhost:8080
# If you have a pre-configured token, you can use it directly.
# For example, if your token is in an environment variable:
# import os
# token = os.getenv("MCP_SERVER_TOKEN")

# Session can be initialized with a token if available
session = Session(base_url="http://localhost:8080", token="YOUR_PRECONFIGURED_TOKEN") # Replace with your actual token

# Example: Execute a tool (conceptual)
# result = session.call_tool("my_tool_name", {"param1": "value1"})
# print(result)

# Example: List tools (conceptual)
# tools = session.list_tools(page=0, size=10)
# for tool in tools.content:
#     print(tool.name)`}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;