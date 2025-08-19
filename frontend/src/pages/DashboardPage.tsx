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