import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Alert, IconButton, InputAdornment, CircularProgress, Card, CardContent } from '@mui/material';
import { Visibility, VisibilityOff, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // Import useAuth to get username

const UserSettingPage: React.FC = () => {
  const { user } = useAuth(); // Get user from AuthContext
  const [permanentToken, setPermanentToken] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // State for password change
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordMessageType, setPasswordMessageType] = useState<'success' | 'error' | null>(null);


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

  const handlePasswordChange = async () => {
    if (!user?.username) {
      setPasswordMessage('User not logged in.');
      setPasswordMessageType('error');
      return;
    }
    if (!oldPassword || !newPassword) {
      setPasswordMessage('Please enter both old and new passwords.');
      setPasswordMessageType('error');
      return;
    }

    setPasswordMessage(null);
    setPasswordMessageType(null);

    try {
      await api.post('/user/changePassword', {
        username: user.username,
        oldPassword,
        newPassword,
      });
      setPasswordMessage('Password changed successfully!');
      setPasswordMessageType('success');
      setOldPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      setPasswordMessage((err as Error).message || 'Failed to change password.');
      setPasswordMessageType('error');
    } finally {
      setTimeout(() => {
        setPasswordMessage(null);
        setPasswordMessageType(null);
      }, 3000);
    }
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

      {/* Permanent API Token Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          {passwordMessage && (
            <Alert severity={passwordMessageType || 'info'} sx={{ mb: 2 }}>
              {passwordMessage}
            </Alert>
          )}
          <TextField
            label="Old Password"
            type="password"
            fullWidth
            variant="outlined"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handlePasswordChange}>
            Change Password
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserSettingPage;
