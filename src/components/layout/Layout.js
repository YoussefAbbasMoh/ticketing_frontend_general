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

  /** MUI default Toolbar min-height; keeps chat/conversation panes sized to viewport − header */
  const headerHeightPx = typeof theme.mixins.toolbar.minHeight === 'number'
    ? theme.mixins.toolbar.minHeight
    : 64;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        '@supports not (height: 100dvh)': {
          minHeight: '100vh',
        },
        '--app-header-height': `${headerHeightPx}px`,
      }}
    >
      <AppBar onMenuClick={handleDrawerToggle} />
      <AppDrawer open={drawerOpen} onClose={handleDrawerClose} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: 0,
          height: `calc(100dvh - ${headerHeightPx}px)`,
          maxHeight: `calc(100dvh - ${headerHeightPx}px)`,
          '@supports not (height: 100dvh)': {
            height: `calc(100vh - ${headerHeightPx}px)`,
            maxHeight: `calc(100vh - ${headerHeightPx}px)`,
          },
          backgroundColor: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {children}
        </div>
      </Box>
    </Box>
  );
};

export default Layout;
