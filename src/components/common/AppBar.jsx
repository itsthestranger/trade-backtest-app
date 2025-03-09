// src/components/common/AppBar.jsx
import React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';

const AppBar = ({ sidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  
  // Get title based on current path
  const getTitle = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/trades':
        return 'Trades';
      case '/backtest':
        return 'Backtest';
      case '/playbooks':
        return 'Playbooks';
      case '/settings':
        return 'Settings';
      default:
        return 'Trade Backtesting App';
    }
  };
  
  return (
    <MuiAppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: (theme) =>
          theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          onClick={toggleSidebar}
          edge="start"
          sx={{ mr: 2 }}
        >
          {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {getTitle()}
        </Typography>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;