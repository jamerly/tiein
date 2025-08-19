import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Alert, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import api from '../services/api';

const UserSettingPage: React.FC = () => {
  const [permanentToken, setPermanentToken] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPermanentToken = async () => {
    setLoading(true);
    try {
      const response = await api.get<string>('/user/permanent-token');
      setPermanentToken(response);
    } catch (err: unknown) {
      setMessage((err as Error).message || 'Failed to fetch permanent token.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermanentToken();
  }, []);

  const handleGenerateNewToken = async () => {
    setLoading(true);
    try {
      const response = await api.post<string>('/user/generate-permanent-token');
      setPermanentToken(response);
      setMessage('New permanent token generated successfully!');
      setMessageType('success');
    } catch (err: unknown) {
      setMessage((err as Error).message || 'Failed to generate new permanent token.');
      setMessageType('error');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 3000);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(permanentToken);
    setMessage('Token copied to clipboard!');
    setMessageType('success');
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 3000);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading User Profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      <Typography variant="h6" gutterBottom>
        Your Permanent API Token
      </Typography>
      {message && (
        <Alert severity={messageType || 'info'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      <TextField
        label="Permanent API Token"
        type={showToken ? 'text' : 'password'}
        fullWidth
        variant="outlined"
        value={permanentToken}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle token visibility"
                onClick={() => setShowToken(!showToken)}
                edge="end"
              >
                {showToken ? <VisibilityOff /> : <Visibility />}
              </IconButton>
              <IconButton
                aria-label="copy token"
                onClick={handleCopyToClipboard}
                edge="end"
                sx={{ ml: 1 }}
              >
                <ContentCopyIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
        helperText="This is your permanent API token. Keep it secure. You can generate a new one if needed."
      />
      <Button variant="contained" onClick={handleGenerateNewToken} disabled={loading}>
        Generate New Token
      </Button>
    </Box>
  );
};

export default UserSettingPage;