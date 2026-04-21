import React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import NotificationBell from '../notifications/NotificationBell';

const AppBar = ({ onMenuClick }) => {
  return (
    <MuiAppBar
      position="static"
      sx={{
        backgroundColor: '#0e1121',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Ticket Management System
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationBell />
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
