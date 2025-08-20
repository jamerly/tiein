import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, List, ListItem, ListItemText, CssBaseline, Menu, MenuItem, Link, IconButton, Drawer, ListItemButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
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
  const [mobileOpen, setMobileOpen] = useState(false); // New state for mobile drawer
  const open = Boolean(anchorEl);

  const handleDrawerToggle = () => { // New handler for mobile drawer
    setMobileOpen(!mobileOpen);
  };

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
    { text: 'Groups', path: '/groups' }, 
    { text: 'Workers', path: '/workers' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width:'100vw' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }} // Only show on xs screens
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src="/assets/logo.svg" alt="TieIn Logo" style={{ height: '30px', marginRight: '10px' }} />
            <b>TieIn</b>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' }, justifyContent: 'center' }}>
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
          <Box sx={{ ml: 'auto' }}> {/* New Box to push username to the right */}
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
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' }, // Only show on xs screens
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        <Toolbar /> {/* To push content below AppBar */}
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => { navigate(item.path); handleDrawerToggle(); }}>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
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