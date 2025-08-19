import React, { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress, Switch, FormControlLabel, Alert, Button, Card, CardContent, Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField } from '@mui/material';
import { Settings as SettingsIcon, People as PeopleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import UserManagementPage from './UserManagementPage'; // Import UserManagementPage

interface SystemSettingsPageProps {
  initialTab?: 'general' | 'users';
}

const SystemSettingsPage: React.FC<SystemSettingsPageProps> = ({ initialTab = 'general' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [openAIApiKey, setOpenAIApiKey] = useState<string>('');
  const [openAIApiKeyStatus, setOpenAIApiKeyStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState(initialTab); // Default to general settings

  const menuItemsData = [
    { id: 'general', text: 'General Settings', icon: <SettingsIcon /> },
    { id: 'users', text: 'User Management', icon: <PeopleIcon /> },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const registrationResponse = await api.get<boolean>('/admin/settings/registration/status');
        setIsRegistrationOpen(registrationResponse);

        const apiKeyResponse = await api.get<string>('/admin/settings/openai/key');
        setOpenAIApiKey(apiKeyResponse || ''); // Set to empty string if null

      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to fetch settings.');
        console.error('Fetch settings error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleRegistration = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = event.target.checked;
    setIsRegistrationOpen(newStatus);
    setUpdateStatus(null);
    try {
      await api.post('/admin/settings/registration/set', null, { params: { open: newStatus } });
      setUpdateStatus('Registration status updated successfully!');
    } catch (err: unknown) {
      setUpdateStatus((err as Error).message || 'Failed to update registration status.');
      console.error('Update registration status error:', err);
      // Revert UI state if update fails
      setIsRegistrationOpen(!newStatus);
    }
  };

      const handleSaveOpenAIApiKey = async () => {
        setOpenAIApiKeyStatus(null);
        try {
            if (openAIApiKey === '') {
                // If the API key is empty, call the DELETE endpoint
                await api.delete('/admin/settings/openai/key');
                setOpenAIApiKeyStatus({ message: 'OpenAI API Key deleted successfully!', type: 'success' });
            } else {
                // Otherwise, call the POST endpoint to update/set the key
                await api.post('/admin/settings/openai/key', openAIApiKey, {
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                });
                setOpenAIApiKeyStatus({ message: 'OpenAI API Key updated successfully!', type: 'success' });
            }
        } catch (err: any) {
            setOpenAIApiKeyStatus({ message: (err as Error).message || 'Failed to update OpenAI API Key.', type: 'error' });
            console.error('Update OpenAI API Key error:', err);
        }
    };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Settings...</Typography>
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
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>

      <Grid container spacing={3} sx={{ height: 'calc(100vh - 120px)' }}> {/* Adjust height based on AppBar and padding */}
        {/* Left Column: Navigation Menu */}
        <Grid item xs={12} md={3} sx={{ height: '100%' }}>
          <List component="nav" sx={{ height: '100%', borderRight: '1px solid #e0e0e0' }}>
            {menuItemsData.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={selectedMenuItem === item.id}
                  onClick={() => setSelectedMenuItem(item.id)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Grid>

        {/* Right Column: Content Area */}
        <Grid item xs={12} md={9}>
          {selectedMenuItem === 'general' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>General Settings</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isRegistrationOpen !== null ? isRegistrationOpen : false}
                      onChange={handleToggleRegistration}
                      name="registrationStatus"
                      color="primary"
                    />
                  }
                  label="Allow New User Registration"
                />
                {updateStatus && (
                  <Alert severity={updateStatus.includes('successfully') ? 'success' : 'error'} sx={{ mt: 2 }}>
                    {updateStatus}
                  </Alert>
                )}

                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>OpenAI API Key</Typography>
                  <TextField
                    fullWidth
                    label="OpenAI API Key"
                    variant="outlined"
                    value={openAIApiKey}
                    onChange={(e) => setOpenAIApiKey(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button variant="contained" onClick={handleSaveOpenAIApiKey}>
                    Save OpenAI API Key
                  </Button>
                  {openAIApiKeyStatus && (
                    <Alert severity={openAIApiKeyStatus.type} sx={{ mt: 2 }}>
                      {openAIApiKeyStatus.message}
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {selectedMenuItem === 'users' && (
            <UserManagementPage />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSettingsPage;
