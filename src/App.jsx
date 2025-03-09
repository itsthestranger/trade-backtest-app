// src/App.jsx
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Context providers
import { DatabaseProvider } from './contexts/DatabaseContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Layout components
import Layout from './components/common/Layout';

// Page components
import Dashboard from './components/dashboard/Dashboard';
import Trades from './components/trades/Trades';
import Backtest from './components/backtest/Backtest';
import Playbooks from './components/playbooks/Playbooks';
import Settings from './components/settings/Settings';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 'bold',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DatabaseProvider>
        <SettingsProvider>
          <Router>
            <Box sx={{ display: 'flex', height: '100vh' }}>
              <Layout sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/trades" element={<Trades />} />
                  <Route path="/backtest" element={<Backtest />} />
                  <Route path="/playbooks" element={<Playbooks />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </Box>
          </Router>
        </SettingsProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
};

export default App;