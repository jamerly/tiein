import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Paper } from '@mui/material';
import { Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChatMessage } from '../services/chat';
import { fetchWelcomeMessage } from '../services/chatbase';

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  chatBaseId: number;
  chatBaseName: string;
  appId: string;
  language: string;
}

interface Message {
  type: 'user' | 'ai';
  text: string;
}

const ChatDialog: React.FC<ChatDialogProps> = ({ open, onClose, chatBaseId, chatBaseName, appId, language }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([]); // Clear messages when dialog opens
      setInput('');

      const getWelcomeMessage = async () => {
        try {
          const welcomeMsg = await fetchWelcomeMessage(appId, language);
          setMessages([{ type: 'ai', text: welcomeMsg }]);
        } catch (error) {
          console.error('Error fetching welcome message:', error);
          // Do not render anything if there's an error
        }
      };
      getWelcomeMessage();
    }
  }, [open, appId, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessageText = input;
    const userMessage: Message = { type: 'user', text: userMessageText };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    // Add a placeholder for AI response that will be updated incrementally
    const aiMessagePlaceholder: Message = { type: 'ai', text: '' };
    setMessages((prevMessages) => [...prevMessages, aiMessagePlaceholder]);

    try {
      let accumulatedResponse = '';
      await sendChatMessage({ chatBaseId, message: userMessageText }, (chunk) => {
        const chunks = chunk.split('\n');
        for( let i=0;i<chunks.length;i++){
          const currentChunk = chunks[i];
          if( currentChunk.startsWith('data:') ){
            const data = currentChunk.substring(5).trim();
            // console.log('Received data:', data);
            
            if (data === '[DONE]') {
              // Stream finished, save history (this part needs backend implementation)
              setLoading(false);
              return;
            }
            if (!data) continue; // Skip empty data
            // Process the data chunk
            // console.log('Received chunk:', data);
            accumulatedResponse += JSON.parse(data.trim())["chunk"]; // Replace escaped newlines with actual newlines
          }
        setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            // Update the last AI message placeholder
            newMessages[newMessages.length - 1] = { type: 'ai', text: accumulatedResponse };
            return newMessages;
          });
        }
        // if (chunk === '[DONE]') {
        //   // Stream finished, save history (this part needs backend implementation)
        //   // For now, just mark as done
        //   setLoading(false);
        //   return;
        // }
        // accumulatedResponse += chunk;
        // setMessages((prevMessages) => {
        //   const newMessages = [...prevMessages];
        //   // Update the last AI message placeholder
        //   newMessages[newMessages.length - 1] = { type: 'ai', text: accumulatedResponse };
        //   return newMessages;
        // });
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = { type: 'ai', text: 'Error: Could not get a response.' };
        return newMessages;
      });
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chat with {chatBaseName}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', height: 400, overflowY: 'auto' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  maxWidth: '70%',
                  bgcolor: msg.type === 'user' ? 'primary.light' : 'grey.200',
                  color: msg.type === 'user' ? 'white' : 'black',
                  borderRadius: msg.type === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        {loading && <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>AI is typing...</Typography>}
      </DialogContent>
      <DialogActions sx={{ p: 2, flexDirection: 'column', alignItems: 'stretch' }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ mb: 1 }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={handleSendMessage}
          disabled={loading || input.trim() === ''}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatDialog;