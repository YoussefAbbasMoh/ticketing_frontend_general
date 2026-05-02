import React, { useState } from 'react';
import { Box, useTheme } from '@mui/material';
import AppBar from './AppBar';
import AppDrawer from './AppDrawer';

const Layout = ({ children }) => {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar onMenuClick={handleDrawerToggle} />
      <AppDrawer open={drawerOpen} onClose={handleDrawerClose} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: theme.palette.background.default,
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
          {children}
        </div>
      </Box>
    </Box>
  );
};

export default Layout;
