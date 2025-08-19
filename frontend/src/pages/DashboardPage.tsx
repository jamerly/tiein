import React, { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress, Grid, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface ServerInfo {
  appName: string;
  appVersion: string;
  uptime: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [toolCount, setToolCount] = useState<number | null>(null);
  const [resourceCount, setResourceCount] = useState<number | null>(null);
  const [promptCount, setPromptCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Server Health
        const healthResponse = await api.get<string>('/mcp-server/health');
        setHealthStatus(healthResponse);

        // Fetch Server Info
        const infoResponse = await api.get<ServerInfo>('/mcp-server/info');
        setServerInfo(infoResponse);

        // Fetch Counts
        const userCountResponse = await api.get<number>('/user/count');
        setUserCount(userCountResponse);

        const toolCountResponse = await api.get<number>('/mcp/tools/count');
        setToolCount(toolCountResponse);

        const resourceCountResponse = await api.get<number>('/mcp/resources/count');
        setResourceCount(resourceCountResponse);

        const promptCountResponse = await api.get<number>('/mcp/prompts/count');
        setPromptCount(promptCountResponse);

      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to fetch dashboard data.');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* System Status */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Status</Typography>
              <Typography variant="body1">Server Health: {healthStatus || 'N/A'}</Typography>
              {serverInfo && (
                <>
                  <Typography variant="body1">App Name: {serverInfo.appName}</Typography>
                  <Typography variant="body1">Version: {serverInfo.appVersion}</Typography>
                  <Typography variant="body1">Uptime: {serverInfo.uptime}</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Counts */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Counts</Typography>
              <Typography variant="body1">Users: {userCount !== null ? userCount : 'N/A'}</Typography>
              <Typography variant="body1">Tools: {toolCount !== null ? toolCount : 'N/A'}</Typography>
              <Typography variant="body1">Resources: {resourceCount !== null ? resourceCount : 'N/A'}</Typography>
              <Typography variant="body1">Prompts: {promptCount !== null ? promptCount : 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
    </Box>
  );
};

export default DashboardPage;