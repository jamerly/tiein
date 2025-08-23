import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchChatHistory } from '../services/chatHistory';
interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  chatBaseId: number;
  chatBaseName: string;
  appId: string;
  language: string;
  chatSessionId?: string; // Added chatSessionId
}

interface Message {
  type: 'user' | 'ai';
  text: string;
}

const ChatDialog: React.FC<ChatDialogProps> = ({ open, onClose, chatBaseId, chatBaseName, appId, language, chatSessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  // Removed input, loading, messagesEndRef states

  useEffect(() => {
    if (open) {
      setMessages([]); // Clear messages when dialog opens
      // Removed setInput('')

      const loadChatHistory = async () => {
        if (!chatSessionId) return; // Only load history if chatSessionId is provided
        try {
          const historyResponse = await fetchChatHistory(chatBaseId, chatSessionId, 0, 20); // Fetch first page
          const loadedMessages: any = historyResponse.content.map(historyItem => ([
            { type: 'user', text: historyItem.userMessage },
            { type: 'ai', text: historyItem.aiResponse }
          ])).flat();
          setMessages(loadedMessages);
        } catch (error) {
          console.error('Error loading chat history:', error);
          // Optionally, display an error message to the user
        }
      };
      loadChatHistory();
    }
  }, [open, appId, language, chatBaseId, chatSessionId]); // Added chatBaseId and chatSessionId to dependencies

  // Removed useEffect for messagesEndRef
  // Removed handleSendMessage function
  // Removed handleKeyPress function

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
          </Box>
        {/* Removed loading Typography */}
      </DialogContent>
      {/* Removed DialogActions */}
    </Dialog>
  );
};

export default ChatDialog;