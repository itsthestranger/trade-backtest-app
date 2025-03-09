// src/components/common/Layout.jsx
import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import AppBar from './AppBar';

const Layout = ({ children, sidebarOpen, toggleSidebar }) => {
  // Calculate content padding based on sidebar state
  const contentPadding = sidebarOpen ? '240px' : '64px';

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      {/* App Bar */}
      <AppBar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Below app bar
          transition: 'padding-left 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
          pl: contentPadding,
          width: { sm: `calc(100% - ${contentPadding})` },
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;