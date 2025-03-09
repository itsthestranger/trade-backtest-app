// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Grid, Typography, Paper, Box, CircularProgress } from '@mui/material';
import { useDatabase } from '../../contexts/DatabaseContext';
import KPICard from './KPICard';
import WeeklyMetricsChart from './WeeklyMetricsChart';

const Dashboard = () => {
  const { db, isLoading: dbLoading } = useDatabase();
  const [kpis, setKpis] = useState(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load KPIs and weekly metrics
  useEffect(() => {
    const loadData = async () => {
      if (dbLoading) return;
      
      try {
        setIsLoading(true);
        
        // Load KPIs
        const kpisData = await db.getKPIs();
        setKpis(kpisData);
        
        // Load weekly metrics
        const weeklyMetricsData = await db.getWeeklyMetrics();
        setWeeklyMetrics(weeklyMetricsData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [db, dbLoading]);

  // Show loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Show dashboard when data is loaded
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Trading Performance Dashboard
      </Typography>
      
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Trades and Total R */}
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Total Trades"
            primary={`${kpis?.totalTrades || 0}`}
            secondary={`Total R: ${(kpis?.totalR || 0).toFixed(2)}`}
            icon="total"
          />
        </Grid>
        
        {/* Winners */}
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Winners"
            primary={`${kpis?.winners || 0}`}
            secondary={`Last 7 Days: ${kpis?.recentWinners || 0}`}
            icon="winner"
            color="success"
          />
        </Grid>
        
        {/* Expenses (Losses) */}
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Expenses"
            primary={`${kpis?.expenses || 0}`}
            secondary={`Last 7 Days: ${kpis?.recentExpenses || 0}`}
            icon="expense"
            color="error"
          />
        </Grid>
        
        {/* Break-Evens */}
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Break Evens"
            primary={`${kpis?.breakEvens || 0}`}
            secondary={`Last 7 Days: ${kpis?.recentBreakEvens || 0}`}
            icon="breakeven"
            color="info"
          />
        </Grid>
        
        {/* Chicken Outs */}
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Chicken Outs"
            primary={`${kpis?.chickenOutCount || 0}`}
            secondary={`Missed R: ${(kpis?.missedR || 0).toFixed(2)}`}
            icon="chicken"
            color="warning"
          />
        </Grid>
        
        {/* Winrate */}
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Winrate"
            primary={`${(kpis?.winRate || 0).toFixed(2)}%`}
            secondary={`(${kpis?.winRateBasedOn || 0} trades)`}
            icon="winrate"
            color="primary"
          />
        </Grid>
        
        {/* Average Win */}
        <Grid item xs={12} sm={6} md={6}>
          <KPICard
            title="Average Win"
            primary={`${(kpis?.averageWin || 0).toFixed(2)}R`}
            secondary=""
            icon="avgwin"
            color="success"
          />
        </Grid>
        
        {/* Average Metrics */}
        <Grid item xs={12} sm={6} md={6}>
          <KPICard
            title="Avg Metrics"
            primary={`${(kpis?.averageMetricsScore || 0).toFixed(2)}`}
            secondary={`(${kpis?.metricsBasedOn || 0} trades)`}
            icon="metrics"
            color="secondary"
          />
        </Grid>
      </Grid>
      
      {/* Weekly Metrics Chart */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Weekly Metrics Score
        </Typography>
        <Box sx={{ height: 400 }}>
          <WeeklyMetricsChart data={weeklyMetrics} />
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;