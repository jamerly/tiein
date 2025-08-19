import type { ReactNode } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, List, ListItem, ListItemText, CssBaseline } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', path: '/dashboard' },
    { text: 'Tools', path: '/tools' },
    { text: 'Resources', path: '/resources' },
    { text: 'Prompts', path: '/prompts' },
    { text: 'Users', path: '/users' },
    { text: 'System Settings', path: '/settings' },
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
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}> {/* mt for AppBar height */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;