import React, { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress, Switch, FormControlLabel, Alert, Button } from '@mui/material';
import api from '../services/api';

const SystemSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

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

      <Box sx={{ mt: 3 }}>
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
      </Box>
    </Box>
  );
};

export default SystemSettingsPage;