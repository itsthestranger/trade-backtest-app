// src/components/trades/TradePlanner/EntryHeatmap.jsx
import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Tooltip, 
  CircularProgress, 
  Alert 
} from '@mui/material';

const EntryHeatmap = ({ data, session, isLoading }) => {
  // Get entry times based on session
  const getEntryTimes = () => {
    const times = [];
    
    if (session === 'ODR') {
      // Generate times from 4:00 to 8:25 in 5-minute intervals
      let hour = 4;
      let minute = 0;
      
      while (hour < 9 || (hour === 8 && minute <= 25)) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeStr);
        
        minute += 5;
        if (minute >= 60) {
          minute = 0;
          hour += 1;
        }
      }
    } else if (session === 'RDR') {
      // Generate times from 10:30 to 15:55 in 5-minute intervals
      let hour = 10;
      let minute = 30;
      
      while (hour < 16 || (hour === 15 && minute <= 55)) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeStr);
        
        minute += 5;
        if (minute >= 60) {
          minute = 0;
          hour += 1;
        }
      }
    }
    
    return times;
  };
  
  // Get color based on R value
  const getColorForR = (totalR, count) => {
    if (count === 0) return '#f0f0f0'; // Gray for no data
    
    if (totalR >= 0) {
      // Green with opacity based on magnitude
      const opacity = Math.min(totalR / 5, 1); // Scale: 0-5R maps to 0-100% opacity
      return `rgba(0, 128, 0, ${opacity})`;
    } else {
      // Red with opacity based on magnitude
      const opacity = Math.min(Math.abs(totalR) / 5, 1); // Scale: 0-5R maps to 0-100% opacity
      return `rgba(255, 0, 0, ${opacity})`;
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Entry Heatmap
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }
  
  // Show no data state
  if (!data || !data.entryMap) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Entry Heatmap
        </Typography>
        <Alert severity="info">
          No data available for the selected criteria. Make selections or add more backtest data.
        </Alert>
      </Paper>
    );
  }
  
  // Calculate the best entry time
  const bestTime = data.bestEntryTime;
  const bestTimeData = data.entryMap[bestTime];
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Entry Heatmap
      </Typography>
      
      {/* Best entry time */}
      {bestTime && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Best Entry Time: {bestTime}
          </Typography>
          <Typography variant="body2">
            Total R: {bestTimeData.totalR.toFixed(2)}, 
            Win Rate: {bestTimeData.winrate.toFixed(1)}%, 
            Trades: {bestTimeData.trades.length}
          </Typography>
        </Box>
      )}
      
      {/* Heatmap grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {getEntryTimes().map((time) => {
          const timeData = data.entryMap[time] || { trades: [], totalR: 0, winrate: 0 };
          const color = getColorForR(timeData.totalR, timeData.trades.length);
          const isBestTime = time === bestTime;
          
          return (
            <Tooltip
              key={time}
              title={
                <>
                  <Typography variant="subtitle2">{time}</Typography>
                  <Typography variant="body2">
                    Total R: {timeData.totalR.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    Win Rate: {timeData.winrate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    Trades: {timeData.trades.length}
                  </Typography>
                </>
              }
              arrow
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  backgroundColor: color,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: isBestTime ? '2px solid black' : '1px solid #ccc',
                  borderRadius: 1,
                  cursor: 'pointer',
                }}
              >
                {timeData.trades.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: timeData.totalR >= 0 ? 'white' : 'white',
                      fontWeight: isBestTime ? 'bold' : 'normal',
                    }}
                  >
                    {timeData.trades.length}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
      
      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 20, height: 20, backgroundColor: 'rgba(0, 128, 0, 0.7)', mr: 1 }} />
          <Typography variant="caption">Profitable</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 20, height: 20, backgroundColor: 'rgba(255, 0, 0, 0.7)', mr: 1 }} />
          <Typography variant="caption">Unprofitable</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 20, height: 20, backgroundColor: '#f0f0f0', border: '1px solid #ccc', mr: 1 }} />
          <Typography variant="caption">No Data</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default EntryHeatmap;