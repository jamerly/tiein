import React, { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress, Switch, FormControlLabel, Alert, Button, Card, CardContent, Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Settings as SettingsIcon, People as PeopleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import UserManagementPage from './UserManagementPage'; // Import UserManagementPage

const SystemSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState('general'); // Default to general settings

  const menuItemsData = [
    { id: 'general', text: 'General Settings', icon: <SettingsIcon /> },
    { id: 'users', text: 'User Management', icon: <PeopleIcon /> },
  ];

  const fetchRegistrationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<boolean>('/admin/settings/registration/status');
      setIsRegistrationOpen(response);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch registration status.');
      console.error('Fetch registration status error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrationStatus();
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
