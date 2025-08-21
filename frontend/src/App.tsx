import 'react';
/// <reference types="vite/client" />

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import UserSettingPage from './pages/UserSettingPage';
import RegisterPage from './pages/RegisterPage';
import IntegrationPage from './pages/IntegrationPage'; // New Import
import ChatBasePage from './pages/ChatBasePage'; // New Import
import Layout from './components/Layout';
import { HttpService } from './services/api';
import { CircularProgress, Box, Typography } from '@mui/material';

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isSystemInitialized, setIsSystemInitialized] = useState<boolean | null>(null);
  const [isLoadingSystemStatus, setIsLoadingSystemStatus] = useState<boolean>(true);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await HttpService.get('/mcp-server/status/initialized');
        console.log('System initialization status API response:', response);
        setIsSystemInitialized(response);
      } catch (err) {
        console.error('Failed to fetch system initialization status:', err);
        setIsSystemInitialized(false);
      } finally {
        setIsLoadingSystemStatus(false);
      }
    };
    checkSystemStatus();
  }, []);

  if (isLoadingSystemStatus) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading System Status...</Typography>
      </Box>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Initial check for system initialization */}
        <Route
          path="/"
          element={
            isSystemInitialized ? (
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            ) : (
              <Navigate to="/register" />
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Authenticated Routes */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/users" element={<SystemSettingsPage initialTab="users" />} />
                  <Route path="/integration/*" element={<IntegrationPage />} /> {/* New Route for Integration */}
                  <Route path="/chatbase" element={<ChatBasePage />} /> {/* New Route for ChatBase */}
                  <Route path="/settings" element={<SystemSettingsPage initialTab="general" />} />
                  <Route path="/profile" element={<UserSettingPage />} />
                  {/* Fallback for any other unmatched path within authenticated area */}
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
