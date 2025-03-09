// src/components/backtest/PerformanceReport.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip as ChartTooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  ChartTooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const PerformanceReport = ({ trades, filter }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  
  useEffect(() => {
    // Calculate performance metrics
    const calculatePerformance = () => {
      if (!trades || trades.length === 0) {
        setPerformanceData(null);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Overview metrics
        const totalTrades = trades.length;
        const winners = trades.filter(trade => trade.status === 'Winner').length;
        const expenses = trades.filter(trade => trade.status === 'Expense').length;
        const breakEven = trades.filter(
          trade => trade.result !== null && Math.abs(trade.result) < 0.1
        ).length;
        
        const winRate = totalTrades > 0 ? (winners / totalTrades) * 100 : 0;
        
        // Calculate consecutive stats
        let currentWinStreak = 0;
        let maxWinStreak = 0;
        let currentExpenseStreak = 0;
        let maxExpenseStreak = 0;
        let currentBreakEvenStreak = 0;
        let maxBreakEvenStreak = 0;
        
        // Sort trades by date
        const sortedTrades = [...trades].sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.confirmation_time || '00:00'}`);
          const dateB = new Date(`${b.date}T${b.confirmation_time || '00:00'}`);
          return dateA - dateB;
        });
        
        sortedTrades.forEach(trade => {
          if (trade.status === 'Winner') {
            currentWinStreak++;
            currentExpenseStreak = 0;
            currentBreakEvenStreak = 0;
            
            if (currentWinStreak > maxWinStreak) {
              maxWinStreak = currentWinStreak;
            }
          } else if (trade.status === 'Expense') {
            currentExpenseStreak++;
            currentWinStreak = 0;
            currentBreakEvenStreak = 0;
            
            if (currentExpenseStreak > maxExpenseStreak) {
              maxExpenseStreak = currentExpenseStreak;
            }
          } else if (trade.result !== null && Math.abs(trade.result) < 0.1) {
            currentBreakEvenStreak++;
            currentWinStreak = 0;
            currentExpenseStreak = 0;
            
            if (currentBreakEvenStreak > maxBreakEvenStreak) {
              maxBreakEvenStreak = currentBreakEvenStreak;
            }
          }
        });
        
        // Calculate average scores
        const tradesWithScores = trades.filter(trade => trade.average !== null);
        const avgPreparation = tradesWithScores.length > 0 ? 
          tradesWithScores.reduce((sum, trade) => sum + (trade.preparation || 0), 0) / tradesWithScores.length : 0;
        const avgEntry = tradesWithScores.length > 0 ? 
          tradesWithScores.reduce((sum, trade) => sum + (trade.entry_score || 0), 0) / tradesWithScores.length : 0;
        const avgStopLoss = tradesWithScores.length > 0 ? 
          tradesWithScores.reduce((sum, trade) => sum + (trade.stop_loss || 0), 0) / tradesWithScores.length : 0;
        const avgTarget = tradesWithScores.length > 0 ? 
          tradesWithScores.reduce((sum, trade) => sum + (trade.target_score || 0), 0) / tradesWithScores.length : 0;
        const avgManagement = tradesWithScores.length > 0 ? 
          tradesWithScores.reduce((sum, trade) => sum + (trade.management || 0), 0) / tradesWithScores.length : 0;
        const avgRules = tradesWithScores.length > 0 ? 
          tradesWithScores.reduce((sum, trade) => sum + (trade.rules || 0), 0) / tradesWithScores.length : 0;
        const avgOverall = tradesWithScores.length > 0 ? 
          tradesWithScores.reduce((sum, trade) => sum + (trade.average || 0), 0) / tradesWithScores.length : 0;
        
        // Calculate total result
        const totalR = trades.reduce((sum, trade) => sum + (trade.result || 0), 0);
        
        // Group trades by different categories for detailed tables
        
        // By Session
        const sessions = ['ODR', 'RDR'];
        const resultBySession = sessions.map(session => {
          const sessionTrades = trades.filter(trade => trade.session === session);
          const sessionWinners = sessionTrades.filter(trade => trade.status === 'Winner').length;
          const sessionExpenses = sessionTrades.filter(trade => trade.status === 'Expense').length;
          const sessionBreakEven = sessionTrades.filter(
            trade => trade.result !== null && Math.abs(trade.result) < 0.1
          ).length;
          const sessionWinRate = sessionTrades.length > 0 ? (sessionWinners / sessionTrades.length) * 100 : 0;
          const sessionResult = sessionTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
          
          return {
            session,
            trades: sessionTrades.length,
            winRate: sessionWinRate,
            winners: sessionWinners,
            expenses: sessionExpenses,
            breakEven: sessionBreakEven,
            result: sessionResult
          };
        });
        
        // By Instrument
        const uniqueInstruments = [...new Set(trades.map(trade => trade.instrument_name))];
        const resultByInstrument = uniqueInstruments.map(instrument => {
          const instrumentTrades = trades.filter(trade => trade.instrument_name === instrument);
          const instrumentWinners = instrumentTrades.filter(trade => trade.status === 'Winner').length;
          const instrumentExpenses = instrumentTrades.filter(trade => trade.status === 'Expense').length;
          const instrumentBreakEven = instrumentTrades.filter(
            trade => trade.result !== null && Math.abs(trade.result) < 0.1
          ).length;
          const instrumentWinRate = instrumentTrades.length > 0 ? (instrumentWinners / instrumentTrades.length) * 100 : 0;
          const instrumentResult = instrumentTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
          
          return {
            instrument,
            trades: instrumentTrades.length,
            winRate: instrumentWinRate,
            winners: instrumentWinners,
            expenses: instrumentExpenses,
            breakEven: instrumentBreakEven,
            result: instrumentResult
          };
        });
        
        // By Confirmation Type
        const confirmationTypes = ['Wick Confirmation', 'Full Confirmation', 'Early Indication', 'No Confirmation'];
        const resultByConfirmationType = confirmationTypes.map(type => {
          const typeTrades = trades.filter(trade => trade.confirmation_type === type);
          const typeWinners = typeTrades.filter(trade => trade.status === 'Winner').length;
          const typeExpenses = typeTrades.filter(trade => trade.status === 'Expense').length;
          const typeBreakEven = typeTrades.filter(
            trade => trade.result !== null && Math.abs(trade.result) < 0.1
          ).length;
          const typeWinRate = typeTrades.length > 0 ? (typeWinners / typeTrades.length) * 100 : 0;
          const typeResult = typeTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
          
          return {
            type,
            trades: typeTrades.length,
            winRate: typeWinRate,
            winners: typeWinners,
            expenses: typeExpenses,
            breakEven: typeBreakEven,
            result: typeResult
          };
        }).filter(item => item.trades > 0);
        
        // By Entry Method
        const uniqueEntryMethods = [...new Set(trades.map(trade => trade.entry_method_name))];
        const resultByEntryMethod = uniqueEntryMethods.map(method => {
          const methodTrades = trades.filter(trade => trade.entry_method_name === method);
          const methodWinners = methodTrades.filter(trade => trade.status === 'Winner').length;
          const methodExpenses = methodTrades.filter(trade => trade.status === 'Expense').length;
          const methodBreakEven = methodTrades.filter(
            trade => trade.result !== null && Math.abs(trade.result) < 0.1
          ).length;
          const methodWinRate = methodTrades.length > 0 ? (methodWinners / methodTrades.length) * 100 : 0;
          const methodResult = methodTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
          
          return {
            method,
            trades: methodTrades.length,
            winRate: methodWinRate,
            winners: methodWinners,
            expenses: methodExpenses,
            breakEven: methodBreakEven,
            result: methodResult
          };
        });
        
        // By Day
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const resultByDay = days.map(day => {
          const dayTrades = trades.filter(trade => trade.day === day);
          const dayWinners = dayTrades.filter(trade => trade.status === 'Winner').length;
          const dayExpenses = dayTrades.filter(trade => trade.status === 'Expense').length;
          const dayBreakEven = dayTrades.filter(
            trade => trade.result !== null && Math.abs(trade.result) < 0.1
          ).length;
          const dayWinRate = dayTrades.length > 0 ? (dayWinners / dayTrades.length) * 100 : 0;
          const dayResult = dayTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
          
          return {
            day,
            trades: dayTrades.length,
            winRate: dayWinRate,
            winners: dayWinners,
            expenses: dayExpenses,
            breakEven: dayBreakEven,
            result: dayResult
          };
        });
        
        // By Confirmation Time
        const getTimes = (start, end, interval) => {
          const times = [];
          let current = start;
          
          while (current <= end) {
            const hours = Math.floor(current / 60).toString().padStart(2, '0');
            const minutes = (current % 60).toString().padStart(2, '0');
            times.push(`${hours}:${minutes}`);
            current += interval;
          }
          
          return times;
        };
        
        const odrtimes = getTimes(4 * 60, 8 * 60 + 25, 30);
        const rdrtimes = getTimes(10 * 60 + 30, 15 * 60 + 55, 30);
        
        const resultByConfirmationTime = [];
        
        // Group by 30-minute intervals
        trades.forEach(trade => {
          if (!trade.confirmation_time) return;
          
          const [hours, minutes] = trade.confirmation_time.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          
          // Find the appropriate 30-minute interval
          let interval;
          if (trade.session === 'ODR') {
            interval = odrtimes.find((time, index) => {
              const [h, m] = time.split(':').map(Number);
              const timeMinutes = h * 60 + m;
              const nextTimeMinutes = index < odrtimes.length - 1 ? 
                (odrtimes[index + 1].split(':').map(Number)[0] * 60 + odrtimes[index + 1].split(':').map(Number)[1]) : 
                Infinity;
              
              return totalMinutes >= timeMinutes && totalMinutes < nextTimeMinutes;
            });
          } else {
            interval = rdrtimes.find((time, index) => {
              const [h, m] = time.split(':').map(Number);
              const timeMinutes = h * 60 + m;
              const nextTimeMinutes = index < rdrtimes.length - 1 ? 
                (rdrtimes[index + 1].split(':').map(Number)[0] * 60 + rdrtimes[index + 1].split(':').map(Number)[1]) : 
                Infinity;
              
              return totalMinutes >= timeMinutes && totalMinutes < nextTimeMinutes;
            });
          }
          
          if (!interval) return;
          
          let timeGroup = resultByConfirmationTime.find(group => group.time === interval);
          
          if (!timeGroup) {
            timeGroup = {
              time: interval,
              trades: 0,
              winners: 0,
              expenses: 0,
              breakEven: 0,
              result: 0,
              winRate: 0
            };
            resultByConfirmationTime.push(timeGroup);
          }
          
          timeGroup.trades++;
          
          if (trade.status === 'Winner') {
            timeGroup.winners++;
          } else if (trade.status === 'Expense') {
            timeGroup.expenses++;
          } else if (trade.result !== null && Math.abs(trade.result) < 0.1) {
            timeGroup.breakEven++;
          }
          
          timeGroup.result += trade.result || 0;
          timeGroup.winRate = (timeGroup.winners / timeGroup.trades) * 100;
        });
        
        // Sort by time
        resultByConfirmationTime.sort((a, b) => {
          const [aHours, aMinutes] = a.time.split(':').map(Number);
          const [bHours, bMinutes] = b.time.split(':').map(Number);
          
          const aMinutesTotal = aHours * 60 + aMinutes;
          const bMinutesTotal = bHours * 60 + bMinutes;
          
          return aMinutesTotal - bMinutesTotal;
        });
        
        // By Stop Loss (group in ranges)
        const stopTicksRanges = [
          { min: 0, max: 5, label: '0-5' },
          { min: 6, max: 10, label: '6-10' },
          { min: 11, max: 15, label: '11-15' },
          { min: 16, max: 20, label: '16-20' },
          { min: 21, max: 25, label: '21-25' },
          { min: 26, max: 30, label: '26-30' },
          { min: 31, max: Infinity, label: '31+' }
        ];
        
        const resultByStopLoss = stopTicksRanges.map(range => {
          const rangeTrades = trades.filter(
            trade => trade.stop_ticks >= range.min && trade.stop_ticks <= range.max
          );
          
          const rangeWinners = rangeTrades.filter(trade => trade.status === 'Winner').length;
          const rangeExpenses = rangeTrades.filter(trade => trade.status === 'Expense').length;
          const rangeBreakEven = rangeTrades.filter(
            trade => trade.result !== null && Math.abs(trade.result) < 0.1
          ).length;
          const rangeWinRate = rangeTrades.length > 0 ? (rangeWinners / rangeTrades.length) * 100 : 0;
          const rangeResult = rangeTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
          
          return {
            range: range.label,
            trades: rangeTrades.length,
            winRate: rangeWinRate,
            winners: rangeWinners,
            expenses: rangeExpenses,
            breakEven: rangeBreakEven,
            result: rangeResult
          };
        }).filter(item => item.trades > 0);
        
        // By Month
        const uniqueMonths = [...new Set(trades.map(trade => trade.date.substring(0, 7)))];
        uniqueMonths.sort();
        
        const resultByMonth = uniqueMonths.map(month => {
          const monthTrades = trades.filter(trade => trade.date.startsWith(month));
          const monthWinners = monthTrades.filter(trade => trade.status === 'Winner').length;
          const monthExpenses = monthTrades.filter(trade => trade.status === 'Expense').length;
          const monthBreakEven = monthTrades.filter(
            trade => trade.result !== null && Math.abs(trade.result) < 0.1
          ).length;
          const monthWinRate = monthTrades.length > 0 ? (monthWinners / monthTrades.length) * 100 : 0;
          const monthResult = monthTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
          
          // Format month label (YYYY-MM to Month YYYY)
          const [year, monthNum] = month.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthLabel = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
          
          return {
            month: monthLabel,
            trades: monthTrades.length,
            winRate: monthWinRate,
            winners: monthWinners,
            expenses: monthExpenses,
            breakEven: monthBreakEven,
            result: monthResult
          };
        });
        
        // By Entry Time (similar to confirmation time)
        const resultByEntryTime = [];
        
        // Group by 30-minute intervals
        trades.forEach(trade => {
          if (!trade.entry_time) return;
          
          const [hours, minutes] = trade.entry_time.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          
          // Find the appropriate 30-minute interval
          let interval;
          if (trade.session === 'ODR') {
            interval = odrtimes.find((time, index) => {
              const [h, m] = time.split(':').map(Number);
              const timeMinutes = h * 60 + m;
              const nextTimeMinutes = index < odrtimes.length - 1 ? 
                (odrtimes[index + 1].split(':').map(Number)[0] * 60 + odrtimes[index + 1].split(':').map(Number)[1]) : 
                Infinity;
              
              return totalMinutes >= timeMinutes && totalMinutes < nextTimeMinutes;
            });
          } else {
            interval = rdrtimes.find((time, index) => {
              const [h, m] = time.split(':').map(Number);
              const timeMinutes = h * 60 + m;
              const nextTimeMinutes = index < rdrtimes.length - 1 ? 
                (rdrtimes[index + 1].split(':').map(Number)[0] * 60 + rdrtimes[index + 1].split(':').map(Number)[1]) : 
                Infinity;
              
              return totalMinutes >= timeMinutes && totalMinutes < nextTimeMinutes;
            });
          }
          
          if (!interval) return;
          
          let timeGroup = resultByEntryTime.find(group => group.time === interval);
          
          if (!timeGroup) {
            timeGroup = {
              time: interval,
              trades: 0,
              winners: 0,
              expenses: 0,
              breakEven: 0,
              result: 0,
              winRate: 0
            };
            resultByEntryTime.push(timeGroup);
          }
          
          timeGroup.trades++;
          
          if (trade.status === 'Winner') {
            timeGroup.winners++;
          } else if (trade.status === 'Expense') {
            timeGroup.expenses++;
          } else if (trade.result !== null && Math.abs(trade.result) < 0.1) {
            timeGroup.breakEven++;
          }
          
          timeGroup.result += trade.result || 0;
          timeGroup.winRate = (timeGroup.winners / timeGroup.trades) * 100;
        });
        
        // Sort by time
        resultByEntryTime.sort((a, b) => {
          const [aHours, aMinutes] = a.time.split(':').map(Number);
          const [bHours, bMinutes] = b.time.split(':').map(Number);
          
          const aMinutesTotal = aHours * 60 + aMinutes;
          const bMinutesTotal = bHours * 60 + bMinutes;
          
          return aMinutesTotal - bMinutesTotal;
        });
        
        // By Direction (with expandable details)
        const directions = ['Long', 'Short'];
        const resultByDirection = directions.map(direction => {
          const directionTrades = trades.filter(trade => trade.direction === direction);
          const directionWinners = directionTrades.filter(trade => trade.status === 'Winner').length;
          const directionExpenses = directionTrades.filter(trade => trade.status === 'Expense').length;
          const directionBreakEven = directionTrades.filter(
            trade => trade.result !== null && Math.abs(trade.result) < 0.1
          ).length;
          const directionWinRate = directionTrades.length > 0 ? (directionWinners / directionTrades.length) * 100 : 0;
          const directionResult = directionTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
          
          // Details by day
          const detailsByDay = days.map(day => {
            const dayTrades = directionTrades.filter(trade => trade.day === day);
            const dayWinners = dayTrades.filter(trade => trade.status === 'Winner').length;
            const dayExpenses = dayTrades.filter(trade => trade.status === 'Expense').length;
            const dayBreakEven = dayTrades.filter(
              trade => trade.result !== null && Math.abs(trade.result) < 0.1
            ).length;
            const dayWinRate = dayTrades.length > 0 ? (dayWinners / dayTrades.length) * 100 : 0;
            const dayResult = dayTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
            
            // Details by session
            const detailsBySession = sessions.map(session => {
              const sessionTrades = dayTrades.filter(trade => trade.session === session);
              const sessionWinners = sessionTrades.filter(trade => trade.status === 'Winner').length;
              const sessionExpenses = sessionTrades.filter(trade => trade.status === 'Expense').length;
              const sessionBreakEven = sessionTrades.filter(
                trade => trade.result !== null && Math.abs(trade.result) < 0.1
              ).length;
              const sessionWinRate = sessionTrades.length > 0 ? (sessionWinners / sessionTrades.length) * 100 : 0;
              const sessionResult = sessionTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
              
              return {
                session,
                trades: sessionTrades.length,
                winRate: sessionWinRate,
                winners: sessionWinners,
                expenses: sessionExpenses,
                breakEven: sessionBreakEven,
                result: sessionResult
              };
            }).filter(item => item.trades > 0);
            
            return {
              day,
              trades: dayTrades.length,
              winRate: dayWinRate,
              winners: dayWinners,
              expenses: dayExpenses,
              breakEven: dayBreakEven,
              result: dayResult,
              details: detailsBySession
            };
          }).filter(item => item.trades > 0);
          
          return {
            direction,
            trades: directionTrades.length,
            winRate: directionWinRate,
            winners: directionWinners,
            expenses: directionExpenses,
            breakEven: directionBreakEven,
            result: directionResult,
            details: detailsByDay
          };
        }).filter(item => item.trades > 0);
        
        // Prepare data for pie chart
        const pieData = {
          labels: ['Winners', 'Expenses', 'Break Even'],
          datasets: [
            {
              data: [winners, expenses, breakEven],
              backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
              borderColor: ['#388e3c', '#d32f2f', '#f57c00'],
              borderWidth: 1,
            },
          ],
        };
        
        // Prepare data for score bar chart
        const scoreData = {
          labels: ['Preparation', 'Entry', 'Stop Loss', 'Target', 'Management', 'Rules', 'Average'],
          datasets: [
            {
              label: 'Average Score',
              data: [
                avgPreparation, 
                avgEntry, 
                avgStopLoss, 
                avgTarget, 
                avgManagement, 
                avgRules,
                avgOverall
              ],
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        };
        
        // Set performance data state
        setPerformanceData({
          overview: {
            totalTrades,
            winners,
            expenses,
            breakEven,
            winRate,
            maxWinStreak,
            maxExpenseStreak,
            maxBreakEvenStreak,
            totalR
          },
          scores: {
            avgPreparation,
            avgEntry,
            avgStopLoss,
            avgTarget,
            avgManagement,
            avgRules,
            avgOverall
          },
          pieData,
          scoreData,
          resultBySession,
          resultByInstrument,
          resultByConfirmationType,
          resultByEntryMethod,
          resultByDay,
          resultByConfirmationTime,
          resultByStopLoss,
          resultByMonth,
          resultByEntryTime,
          resultByDirection
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error calculating performance:', error);
        setIsLoading(false);
      }
    };
    
    calculatePerformance();
  }, [trades]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Show no data state
  if (!performanceData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No data available for performance analysis. Add trades to see performance metrics.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Performance Report
        {filter && ` - ${filter.name}`}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Performance Overview */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Overview Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Total Trades:</Typography>
                  <Typography variant="h6">{performanceData.overview.totalTrades}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Win Rate:</Typography>
                  <Typography variant="h6">{performanceData.overview.winRate.toFixed(1)}%</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Winners:</Typography>
                  <Typography variant="h6">{performanceData.overview.winners}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Expenses:</Typography>
                  <Typography variant="h6">{performanceData.overview.expenses}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Break Even:</Typography>
                  <Typography variant="h6">{performanceData.overview.breakEven}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Max Win Streak:</Typography>
                  <Typography variant="h6">{performanceData.overview.maxWinStreak}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Max Expense Streak:</Typography>
                  <Typography variant="h6">{performanceData.overview.maxExpenseStreak}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Max Break Even Streak:</Typography>
                  <Typography variant="h6">{performanceData.overview.maxBreakEvenStreak}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Total Result:</Typography>
                  <Typography 
                    variant="h5" 
                    color={performanceData.overview.totalR >= 0 ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {performanceData.overview.totalR.toFixed(2)}R
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" gutterBottom>
                Trade Results
              </Typography>
              <Box sx={{ height: 220, mt: 'auto', mb: 'auto' }}>
                <Pie data={performanceData.pieData} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Performance Scores */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Performance Scores
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar 
                  data={performanceData.scoreData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                          display: true,
                          text: 'Score (1-10)'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Detailed Tables */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Detailed Analysis
              </Typography>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                  <Tab label="By Session" />
                  <Tab label="By Instrument" />
                  <Tab label="By Confirmation Type" />
                  <Tab label="By Entry Method" />
                  <Tab label="By Day" />
                  <Tab label="By Confirmation Time" />
                  <Tab label="By Stop Loss" />
                  <Tab label="By Month" />
                  <Tab label="By Entry Time" />
                  <Tab label="By Direction" />
                </Tabs>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                {/* By Session */}
                {tabIndex === 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Session</TableCell>
                          <TableCell align="right">Trades</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Winners</TableCell>
                          <TableCell align="right">Expenses</TableCell>
                          <TableCell align="right">Break Even</TableCell>
                          <TableCell align="right">Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resultBySession.map((row) => (
                          <TableRow key={row.session}>
                            <TableCell component="th" scope="row">{row.session}</TableCell>
                            <TableCell align="right">{row.trades}</TableCell>
                            <TableCell align="right">{row.winRate.toFixed(1)}%</TableCell>
                            <TableCell align="right">{row.winners}</TableCell>
                            <TableCell align="right">{row.expenses}</TableCell>
                            <TableCell align="right">{row.breakEven}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: row.result >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {row.result.toFixed(2)}R
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* By Instrument */}
                {tabIndex === 1 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Instrument</TableCell>
                          <TableCell align="right">Trades</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Winners</TableCell>
                          <TableCell align="right">Expenses</TableCell>
                          <TableCell align="right">Break Even</TableCell>
                          <TableCell align="right">Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resultByInstrument.map((row) => (
                          <TableRow key={row.instrument}>
                            <TableCell component="th" scope="row">{row.instrument}</TableCell>
                            <TableCell align="right">{row.trades}</TableCell>
                            <TableCell align="right">{row.winRate.toFixed(1)}%</TableCell>
                            <TableCell align="right">{row.winners}</TableCell>
                            <TableCell align="right">{row.expenses}</TableCell>
                            <TableCell align="right">{row.breakEven}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: row.result >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {row.result.toFixed(2)}R
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* By Confirmation Type */}
                {tabIndex === 2 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Confirmation Type</TableCell>
                          <TableCell align="right">Trades</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Winners</TableCell>
                          <TableCell align="right">Expenses</TableCell>
                          <TableCell align="right">Break Even</TableCell>
                          <TableCell align="right">Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resultByConfirmationType.map((row) => (
                          <TableRow key={row.type}>
                            <TableCell component="th" scope="row">{row.type}</TableCell>
                            <TableCell align="right">{row.trades}</TableCell>
                            <TableCell align="right">{row.winRate.toFixed(1)}%</TableCell>
                            <TableCell align="right">{row.winners}</TableCell>
                            <TableCell align="right">{row.expenses}</TableCell>
                            <TableCell align="right">{row.breakEven}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: row.result >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {row.result.toFixed(2)}R
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* By Entry Method */}
                {tabIndex === 3 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Entry Method</TableCell>
                          <TableCell align="right">Trades</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Winners</TableCell>
                          <TableCell align="right">Expenses</TableCell>
                          <TableCell align="right">Break Even</TableCell>
                          <TableCell align="right">Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resultByEntryMethod.map((row) => (
                          <TableRow key={row.method}>
                            <TableCell component="th" scope="row">{row.method}</TableCell>
                            <TableCell align="right">{row.trades}</TableCell>
                            <TableCell align="right">{row.winRate.toFixed(1)}%</TableCell>
                            <TableCell align="right">{row.winners}</TableCell>
                            <TableCell align="right">{row.expenses}</TableCell>
                            <TableCell align="right">{row.breakEven}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: row.result >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {row.result.toFixed(2)}R
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* By Day */}
                {tabIndex === 4 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Day</TableCell>
                          <TableCell align="right">Trades</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Winners</TableCell>
                          <TableCell align="right">Expenses</TableCell>
                          <TableCell align="right">Break Even</TableCell>
                          <TableCell align="right">Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resultByDay.map((row) => (
                          <TableRow key={row.day}>
                            <TableCell component="th" scope="row">{row.day}</TableCell>
                            <TableCell align="right">{row.trades}</TableCell>
                            <TableCell align="right">{row.winRate.toFixed(1)}%</TableCell>
                            <TableCell align="right">{row.winners}</TableCell>
                            <TableCell align="right">{row.expenses}</TableCell>
                            <TableCell align="right">{row.breakEven}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: row.result >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {row.result.toFixed(2)}R
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* By Confirmation Time */}
                {tabIndex === 5 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Confirmation Time</TableCell>
                          <TableCell align="right">Trades</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Winners</TableCell>
                          <TableCell align="right">Expenses</TableCell>
                          <TableCell align="right">Break Even</TableCell>
                          <TableCell align="right">Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resultByConfirmationTime.map((row) => (
                          <TableRow key={row.time}>
                            <TableCell component="th" scope="row">{row.time}</TableCell>
                            <TableCell align="right">{row.trades}</TableCell>
                            <TableCell align="right">{row.winRate.toFixed(1)}%</TableCell>
                            <TableCell align="right">{row.winners}</TableCell>
                            <TableCell align="right">{row.expenses}</TableCell>
                            <TableCell align="right">{row.breakEven}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: row.result >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {row.result.toFixed(2)}R
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* By Stop Loss */}
                {tabIndex === 6 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Stop Ticks</TableCell>
                          <TableCell align="right">Trades</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Winners</TableCell>
                          <TableCell align="right">Expenses</TableCell>
                          <TableCell align="right">Break Even</TableCell>
                          <TableCell align="right">Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resultByStopLoss.map((row) => (
                          <TableRow key={row.range}>
                            <TableCell component="th" scope="row">{row.range}</TableCell>
                            <TableCell align="right">{row.trades}</TableCell>
                            <TableCell align="right">{row.winRate.toFixed(1)}%</TableCell>
                            <TableCell align="right">{row.winners}</TableCell>
                            <TableCell align="right">{row.expenses}</TableCell>
                            <TableCell align="right">{row.breakEven}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: row.result >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {row.result.toFixed(2)}R
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* By Month */}
                {tabIndex === 7 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell align="right">Trades</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Winners</TableCell>
                          <TableCell align="right">Expenses</TableCell>
                          <TableCell align="right">Break Even</TableCell>
                          <TableCell align="right">Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resultByMonth.map((row) => (
                          <TableRow key={row.month}>
                            <TableCell component="th" scope="row">{row.month}</TableCell>
                            <TableCell align="right">{row.trades}</TableCell>
                            <TableCell align="right">{row.winRate.toFixed(1)}%</TableCell>
                            <TableCell align="right">{row.winners}</TableCell>
                            <TableCell align="right">{row.expenses}</TableCell>
                            <TableCell align="right">{row.breakEven}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: row.result >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {row.result.toFixed(2)}R
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* By Entry Time */}
                {tabIndex === 8 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Entry Time</TableCell>
                          <TableCell align="right">Trades</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Winners</TableCell>
                          <TableCell align="right">Expenses</TableCell>
                          <TableCell align="right">Break Even</TableCell>
                          <TableCell align="right">Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resultByEntryTime.map((row) => (
                          <TableRow key={row.time}>
                            <TableCell component="th" scope="row">{row.time}</TableCell>
                            <TableCell align="right">{row.trades}</TableCell>
                            <TableCell align="right">{row.winRate.toFixed(1)}%</TableCell>
                            <TableCell align="right">{row.winners}</TableCell>
                            <TableCell align="right">{row.expenses}</TableCell>
                            <TableCell align="right">{row.breakEven}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: row.result >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {row.result.toFixed(2)}R
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* By Direction */}
                {tabIndex === 9 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Direction</TableCell>
                          <TableCell align="right">Trades</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Winners</TableCell>
                          <TableCell align="right">Expenses</TableCell>
                          <TableCell align="right">Break Even</TableCell>
                          <TableCell align="right">Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceData.resultByDirection.map((row) => (
                          <React.Fragment key={row.direction}>
                            <TableRow>
                              <TableCell component="th" scope="row">{row.direction}</TableCell>
                              <TableCell align="right">{row.trades}</TableCell>
                              <TableCell align="right">{row.winRate.toFixed(1)}%</TableCell>
                              <TableCell align="right">{row.winners}</TableCell>
                              <TableCell align="right">{row.expenses}</TableCell>
                              <TableCell align="right">{row.breakEven}</TableCell>
                              <TableCell 
                                align="right"
                                sx={{ color: row.result >= 0 ? 'success.main' : 'error.main' }}
                              >
                                {row.result.toFixed(2)}R
                              </TableCell>
                            </TableRow>
                            {/* Details by day */}
                            {row.details.map((dayDetail) => (
                              <TableRow key={`${row.direction}-${dayDetail.day}`} sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ pl: 4 }}>{dayDetail.day}</TableCell>
                                <TableCell align="right">{dayDetail.trades}</TableCell>
                                <TableCell align="right">{dayDetail.winRate.toFixed(1)}%</TableCell>
                                <TableCell align="right">{dayDetail.winners}</TableCell>
                                <TableCell align="right">{dayDetail.expenses}</TableCell>
                                <TableCell align="right">{dayDetail.breakEven}</TableCell>
                                <TableCell 
                                  align="right"
                                  sx={{ color: dayDetail.result >= 0 ? 'success.main' : 'error.main' }}
                                >
                                  {dayDetail.result.toFixed(2)}R
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceReport;