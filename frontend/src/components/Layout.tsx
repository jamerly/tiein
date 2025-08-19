import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, List, ListItem, ListItemText, CssBaseline, Menu, MenuItem, Link } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth(); // Get user from useAuth
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', path: '/dashboard' },
    { text: 'Tools', path: '/tools' },
    { text: 'Resources', path: '/resources' },
    { text: 'Prompts', path: '/prompts' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width:'100vw' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            TieIn
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            {menuItems.map((item) => (
              <Button
                key={item.text}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{
                  my: 2,
                  color: 'white',
                  display: 'block',
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  borderBottom: location.pathname === item.path ? '2px solid white' : 'none',
                  '&:focus': {
                    outline: 'none', // Remove outline on focus
                  },
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
          <Button
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ textTransform: 'none' }} // Prevent uppercase
          >
            {user?.username || 'Guest'}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>User Profile</MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>System Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}> {/* mt for AppBar height */}
        {children}
      </Box>
      <Box component="footer" sx={{ p: 2, mt: 'auto', bgcolor: 'background.paper', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {'Copyright © '}
          <Link color="inherit" href="https://www.jamerly.ai" target="_blank" rel="noopener noreferrer">
            Jamerly Global
          </Link>{' '}
          {new Date().getFullYear()}.
          {' All rights reserved.'}
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;