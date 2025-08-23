import React, { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress, Grid, Card, CardContent, Switch, FormControlLabel, TextField, Button, Tabs, Tab } from '@mui/material';
import {HttpService} from '../services/api';
import UserManagementPage from './UserManagementPage';

interface SystemSettingsPageProps {
  initialTab?: 'users' | 'general';
}

const SystemSettingsPage: React.FC<SystemSettingsPageProps> = ({ initialTab = 'general' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean | null>(null);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [currentTab, setCurrentTab] = useState(initialTab);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const regStatusResponse = await HttpService.get('/admin/settings/registration/status');
        setIsRegistrationOpen(regStatusResponse);
        const apiKeyResponse = await HttpService.get('/admin/settings/openai/key');
        setOpenaiApiKey(apiKeyResponse || '');
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to fetch system settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleRegistration = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = event.target.checked;
    setIsRegistrationOpen(newStatus);
    try {
      await HttpService.post('/admin/settings/registration/set', null, { params: { open: newStatus } });
    } catch (err: unknown) {
      console.error('Update registration status error:', err);
      // Revert UI state if update fails
      setIsRegistrationOpen(!newStatus);
    }
  };

  const handleSaveOpenAIApiKey = async () => {
    try {
      if (openaiApiKey === '') {
        // If the API key is empty, call the DELETE endpoint
        await HttpService.delete('/admin/settings/openai/key');
      } else {
        // Otherwise, call the POST endpoint to update/set the key
        await HttpService.post('/admin/settings/openai/key', { "key" : openaiApiKey});
      }
    } catch (err: any) {
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

      <Grid container spacing={3} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} md={3} sx={{ height: '100%' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Tabs
                orientation="vertical"
                variant="scrollable"
                value={currentTab}
                onChange={(_, newValue) => setCurrentTab(newValue as 'users' | 'general')}
                aria-label="Vertical tabs example"
                sx={{ borderRight: 1, borderColor: 'divider' }}
              >
                <Tab label="General" value="general" />
                <Tab label="Users" value="users" />
              </Tabs>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={9}>
          {currentTab === 'general' && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  General Settings
                </Typography>
                <FormControlLabel
                  control={<Switch checked={isRegistrationOpen || false} onChange={handleToggleRegistration} />}
                  label="Allow User Registration"
                />
                <TextField
                  label="OpenAI API Key"
                  fullWidth
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  margin="normal"
                />
                <Button variant="contained" onClick={handleSaveOpenAIApiKey}>Save Changes</Button>
              </CardContent>
            </Card>
          )}
          {currentTab === 'users' && <UserManagementPage />}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSettingsPage;
