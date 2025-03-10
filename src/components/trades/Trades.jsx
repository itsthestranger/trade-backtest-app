// src/components/trades/Trades.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Tabs, 
  Tab, 
  Button, 
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useDatabase } from '../../contexts/DatabaseContext';
import TradeTable from './TradeTable';
import TradeDocumentation from './TradeDocumentation';
import TradePlanner from './TradePlanner/TradePlanner';

const Trades = () => {
  const { db, isLoading: dbLoading } = useDatabase();
  const [trades, setTrades] = useState([]);
  const [filters, setFilters] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlanner, setShowPlanner] = useState(false);

  // Load trades and filters
  useEffect(() => {
    const loadData = async () => {
      if (dbLoading) return;
      
      try {
        setIsLoading(true);
        
        // Load filters
        const filtersData = await db.getFilters();
        setFilters(filtersData);
        
        // Load trades - specifically only live trades
        const tradesData = await db.getTrades({ is_live_trade: true });
        setTrades(tradesData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading trades data:', error);
        setError('Failed to load trades data. Please try again.');
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [db, dbLoading]);

  // Handle tab change
  const handleTabChange = async (event, newValue) => {
    setSelectedTab(newValue);
    setSelectedTrade(null);
    setIsLoading(true);
    
    try {
      let tradesData;
      
      if (newValue === 0) {
        // "All Trades" tab - but still only live trades
        tradesData = await db.getTrades({ is_live_trade: true });
      } else {
        // Filter tab
        const filter = filters[newValue - 1];

        // Combine the filter with the live trades requirement
        const combinedFilter = {
          ...filter,
          is_live_trade: true
        };

        tradesData = await db.getTrades(combinedFilter);
      }
      
      setTrades(tradesData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading filtered trades:', error);
      setError('Failed to load trades. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle trade selection
  const handleTradeSelect = (trade) => {
    setSelectedTrade(trade);
  };

  // Handle trade creation
  const handleTradeCreate = async (tradeData) => {
    try {
      // Ensure backtest_id is null for live trades
      const newTradeData = {
        ...tradeData,
        backtest_id: null
      };
      
      const newTrade = await db.createTrade(newTradeData);
      setTrades([newTrade, ...trades]);
      return newTrade;
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  };

  // Handle trade update
  const handleTradeUpdate = async (id, tradeData) => {
    try {
      const updatedTrade = await db.updateTrade(id, tradeData);
      
      setTrades(
        trades.map((trade) => (trade.id === id ? updatedTrade : trade))
      );
      
      if (selectedTrade && selectedTrade.id === id) {
        setSelectedTrade(updatedTrade);
      }
      
      return updatedTrade;
    } catch (error) {
      console.error('Error updating trade:', error);
      throw error;
    }
  };

  // Handle trade deletion
  const handleTradeDelete = async (id) => {
    try {
      await db.deleteTrade(id);
      
      setTrades(trades.filter((trade) => trade.id !== id));
      
      if (selectedTrade && selectedTrade.id === id) {
        setSelectedTrade(null);
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
  };

  // Toggle trade planner
  const toggleTradePlanner = () => {
    setShowPlanner(!showPlanner);
  };

  // Show loading state
  if (isLoading && !showPlanner) {
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
  if (error && !showPlanner) {
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4">Trades</Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mr: 2 }}
                onClick={() => handleTradeSelect(null)}
              >
                Add Trade
              </Button>
              <Button
                variant="outlined"
                onClick={toggleTradePlanner}
              >
                {showPlanner ? "Hide Planner" : "Trade Planner"}
              </Button>
            </Box>
          </Box>
        </Grid>
        
        {showPlanner ? (
          <Grid item xs={12}>
            <TradePlanner 
              onCreateTrade={handleTradeCreate}
              onClose={toggleTradePlanner}
            />
          </Grid>
        ) : (
          <>
            <Grid item xs={12}>
              <Paper sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab label="All Trades" />
                    {filters.map((filter) => (
                      <Tab key={filter.id} label={filter.name} />
                    ))}
                  </Tabs>
                </Box>
                <TradeTable
                  trades={trades}
                  onSelect={handleTradeSelect}
                  onUpdate={handleTradeUpdate}
                  onDelete={handleTradeDelete}
                />
              </Paper>
            </Grid>
            
            {selectedTrade && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, mt: 2 }}>
                  <TradeDocumentation
                    trade={selectedTrade}
                    onUpdate={handleTradeUpdate}
                    onClose={() => setSelectedTrade(null)}
                  />
                </Paper>
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
};

export default Trades;