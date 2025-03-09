// src/components/common/Sidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TradesIcon,
  BarChart as BacktestIcon,
  Book as PlaybooksIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

// Drawer width
const drawerWidth = 240;

const Sidebar = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Menu items
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
    },
    {
      text: 'Trades',
      icon: <TradesIcon />,
      path: '/trades',
    },
    {
      text: 'Backtest',
      icon: <BacktestIcon />,
      path: '/backtest',
    },
    {
      text: 'Playbooks',
      icon: <PlaybooksIcon />,
      path: '/playbooks',
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : 64,
        transition: 'width 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 64,
          boxSizing: 'border-box',
          transition: 'width 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ mt: 8 }}>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <Tooltip title={open ? '' : item.text} placement="right">
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ opacity: open ? 1 : 0 }} 
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;