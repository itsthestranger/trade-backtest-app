// src/components/dashboard/KPICard.jsx
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  ShowChart as TotalIcon,
  ThumbUp as WinnerIcon,
  ThumbDown as ExpenseIcon,
  HorizontalRule as BreakevenIcon,
  Warning as ChickenIcon,
  Percent as WinrateIcon,
  TrendingUp as AvgWinIcon,
  Score as MetricsIcon,
} from '@mui/icons-material';

const KPICard = ({ title, primary, secondary, icon, color = 'primary' }) => {
  // Map of icon types
  const iconMap = {
    total: <TotalIcon fontSize="large" color={color} />,
    winner: <WinnerIcon fontSize="large" color={color} />,
    expense: <ExpenseIcon fontSize="large" color={color} />,
    breakeven: <BreakevenIcon fontSize="large" color={color} />,
    chicken: <ChickenIcon fontSize="large" color={color} />,
    winrate: <WinrateIcon fontSize="large" color={color} />,
    avgwin: <AvgWinIcon fontSize="large" color={color} />,
    metrics: <MetricsIcon fontSize="large" color={color} />,
  };

  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        height: '100%',
        borderLeft: 4,
        borderColor: `${color}.main`,
      }}
      elevation={2}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {primary}
        </Typography>
        {secondary && (
          <Typography variant="subtitle1" color="text.secondary">
            {secondary}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          ml: 2,
        }}
      >
        {iconMap[icon]}
      </Box>
    </Paper>
  );
};

export default KPICard;