// src/components/settings/Settings.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Tune as TuneIcon,
  Money as MoneyIcon,
  CallMerge as MergeIcon,
  Backup as BackupIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';
import InstrumentSettings from './InstrumentSettings';
import EntryMethodSettings from './EntryMethodSettings';
import AccountSettings from './AccountSettings';
import ConfluenceSettings from './ConfluenceSettings';
import BackupRestore from './BackupRestore';

const Settings = () => {
  const { isLoading } = useSettings();
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="settings tabs"
        >
          <Tab icon={<TrendingUpIcon />} label="Instruments" />
          <Tab icon={<TuneIcon />} label="Entry Methods" />
          <Tab icon={<MoneyIcon />} label="Accounts" />
          <Tab icon={<MergeIcon />} label="Confluences" />
          <Tab icon={<BackupIcon />} label="Backup & Restore" />
        </Tabs>
      </Paper>
      
      <Box role="tabpanel" hidden={tabIndex !== 0}>
        {tabIndex === 0 && <InstrumentSettings />}
      </Box>
      
      <Box role="tabpanel" hidden={tabIndex !== 1}>
        {tabIndex === 1 && <EntryMethodSettings />}
      </Box>
      
      <Box role="tabpanel" hidden={tabIndex !== 2}>
        {tabIndex === 2 && <AccountSettings />}
      </Box>
      
      <Box role="tabpanel" hidden={tabIndex !== 3}>
        {tabIndex === 3 && <ConfluenceSettings />}
      </Box>
      
      <Box role="tabpanel" hidden={tabIndex !== 4}>
        {tabIndex === 4 && <BackupRestore />}
      </Box>
    </Box>
  );
};

export default Settings;