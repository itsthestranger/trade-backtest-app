// src/components/trades/TradePlanner/PlaybookHeatmap.jsx
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

const PlaybookHeatmap = ({ playbookData, backtestData, isLoading }) => {
  // Show loading state
  if (isLoading) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Playbook Heatmap
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }
  
  // Calculate backtest stats
  const calculateStats = () => {
    if (!backtestData || backtestData.length === 0) {
      return {
        backtestStats: {
          totalTrades: 0,
          totalR: 0,
          winRate: 0,
          winners: 0,
          expenses: 0
        },
        liveTradeStats: {
          totalTrades: 0,
          totalR: 0,
          winRate: 0,
          winners: 0,
          expenses: 0
        }
      };
    }
    
    // Separate backtest and live trades
    const backtestTrades = backtestData.filter(trade => trade.backtest_id !== null);
    const liveTrades = backtestData.filter(trade => trade.backtest_id === null);
    
    // Calculate backtest stats
    const backtestStats = calculateStatsForTrades(backtestTrades);
    
    // Calculate live trade stats
    const liveTradeStats = calculateStatsForTrades(liveTrades);
    
    return {
      backtestStats,
      liveTradeStats
    };
  };

  // Helper function to calculate stats for a set of trades
  const calculateStatsForTrades = (trades) => {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        totalR: 0,
        winRate: 0,
        winners: 0,
        expenses: 0
      };
    }
    
    const totalTrades = trades.length;
    const totalR = trades.reduce((sum, trade) => sum + (trade.result || 0), 0);
    const winners = trades.filter(trade => trade.status === 'Winner').length;
    const expenses = trades.filter(trade => trade.status === 'Expense').length;
    
    // Exclude break even trades from winrate calculation
    const tradesForWinRate = trades.filter(
      trade => trade.status === 'Winner' || trade.status === 'Expense'
    ).length;
    
    const winRate = tradesForWinRate > 0 ? (winners / tradesForWinRate) * 100 : 0;
    
    return {
      totalTrades,
      totalR,
      winRate,
      winners,
      expenses
    };
  };

  const stats = calculateStats();
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Playbook Heatmap
      </Typography>
      
      {(!backtestData || backtestData.length === 0) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No backtest data available for the selected criteria.
        </Alert>
      )}
      
      {/* Stats Container */}
      <Box sx={{ mb: 2 }}>
        {/* Backtest Statistics */}
        {stats.backtestStats.totalTrades > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              Backtest Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Total Trades:</Typography>
                <Typography variant="h6">{stats.backtestStats.totalTrades}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Total R:</Typography>
                <Typography variant="h6" color={stats.backtestStats.totalR >= 0 ? 'success.main' : 'error.main'}>
                  {stats.backtestStats.totalR.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Win Rate:</Typography>
                <Typography variant="h6">{stats.backtestStats.winRate.toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Winners/Expenses:</Typography>
                <Typography variant="h6">
                  {stats.backtestStats.winners}/{stats.backtestStats.expenses}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Live Trade Statistics */}
        {stats.liveTradeStats.totalTrades > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              Live Trade Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Total Trades:</Typography>
                <Typography variant="h6">{stats.liveTradeStats.totalTrades}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Total R:</Typography>
                <Typography variant="h6" color={stats.liveTradeStats.totalR >= 0 ? 'success.main' : 'error.main'}>
                  {stats.liveTradeStats.totalR.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Win Rate:</Typography>
                <Typography variant="h6">{stats.liveTradeStats.winRate.toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Winners/Expenses:</Typography>
                <Typography variant="h6">
                  {stats.liveTradeStats.winners}/{stats.liveTradeStats.expenses}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Playbook Details */}
      {playbookData ? (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Playbook Details
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Retracement Time 1
                  </TableCell>
                  <TableCell>
                    {playbookData.time_cl_1_start} - {playbookData.time_cl_1_end}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Retracement Time 2
                  </TableCell>
                  <TableCell>
                    {playbookData.mode_time_start} - {playbookData.mode_time_end}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Retracement 1
                  </TableCell>
                  <TableCell>
                    {playbookData.ret_cluster_1_start} - {playbookData.ret_cluster_1_end}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Retracement 2
                  </TableCell>
                  <TableCell>
                    {playbookData.ret_cluster_2_start} - {playbookData.ret_cluster_2_end}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Retracement 3
                  </TableCell>
                  <TableCell>
                    {playbookData.ret_cluster_3_start} - {playbookData.ret_cluster_3_end}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Extension 1
                  </TableCell>
                  <TableCell>
                    {playbookData.ext_cluster_1_start} - {playbookData.ext_cluster_1_end}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Extension 2
                  </TableCell>
                  <TableCell>
                    {playbookData.ext_cluster_2_start} - {playbookData.ext_cluster_2_end}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Ret. Median Time
                  </TableCell>
                  <TableCell>
                    {playbookData.ret_median_time}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Dropoff Time
                  </TableCell>
                  <TableCell>
                    {playbookData.dropoff_time}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Ext. Median Time
                  </TableCell>
                  <TableCell>
                    {playbookData.ext_median_time}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Alert severity="info">
          No playbook data available for the selected criteria. Create a playbook for this setup in the Playbooks section.
        </Alert>
      )}
    </Paper>
  );
};

export default PlaybookHeatmap;