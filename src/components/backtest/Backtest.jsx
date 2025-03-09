// src/components/backtest/Backtest.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Divider,
  OutlinedInput
} from '@mui/material';
import { Add as AddIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useSettings } from '../../contexts/SettingsContext';
import BacktestTable from './BacktestTable';
import Filters from './Filters';
import DocumentationView from './DocumentationView';
import PerformanceReport from './PerformanceReport';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const Backtest = () => {
  const { db, isLoading: dbLoading } = useDatabase();
  const { confluences, isLoading: settingsLoading } = useSettings();
  
  const [trades, setTrades] = useState([]);
  const [backtests, setBacktests] = useState([]);
  const [filters, setFilters] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedBacktest, setSelectedBacktest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [backtestForm, setBacktestForm] = useState({
    name: '',
    confluences: []
  });
  const [viewMode, setViewMode] = useState('table'); // 'table', 'documentation', 'performance'
  
  // Load backtests, filters, and trades
  useEffect(() => {
    const loadData = async () => {
      if (dbLoading || settingsLoading) return;
      
      try {
        setIsLoading(true);
        
        // Load backtests
        const backtestsData = await db.getBacktests();
        setBacktests(backtestsData);
        
        // Load filters
        const filtersData = await db.getFilters();
        setFilters(filtersData);
        
        // Set default backtest if available
        if (backtestsData.length > 0 && !selectedBacktest) {
          setSelectedBacktest(backtestsData[0]);
          
          // Load trades for default backtest
          const tradesData = await db.getTrades({ backtest_id: backtestsData[0].id });
          setTrades(tradesData);
        } else if (selectedBacktest) {
          // Load trades for selected backtest
          const tradesData = await db.getTrades({ backtest_id: selectedBacktest.id });
          setTrades(tradesData);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading backtest data:', error);
        setError('Failed to load backtest data. Please try again.');
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [db, dbLoading, settingsLoading, selectedBacktest]);
  
  // Handle tab change
  const handleTabChange = async (event, newValue) => {
    setSelectedTab(newValue);
    setIsLoading(true);
    
    try {
      let tradesData;
      
      if (newValue === 0) {
        // "All Trades" tab
        if (selectedBacktest) {
          tradesData = await db.getTrades({ backtest_id: selectedBacktest.id });
        } else {
          tradesData = [];
        }
      } else {
        // Filter tab
        const filter = filters[newValue - 1];
        
        if (selectedBacktest) {
          // Combine backtest filter with tab filter
          const combinedFilter = {
            ...filter,
            backtest_id: selectedBacktest.id
          };
          
          tradesData = await db.getTrades(combinedFilter);
        } else {
          tradesData = await db.getTrades(filter);
        }
      }
      
      setTrades(tradesData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading filtered trades:', error);
      setError('Failed to load trades. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle backtest selection change
  const handleBacktestChange = async (event) => {
    const backtestId = event.target.value;
    
    if (backtestId === 'new') {
      setCreateDialogOpen(true);
      return;
    }
    
    const backtest = backtests.find(b => b.id === backtestId);
    setSelectedBacktest(backtest);
    
    // Reset to first tab
    setSelectedTab(0);
    
    // Load trades for selected backtest
    try {
      setIsLoading(true);
      const tradesData = await db.getTrades({ backtest_id: backtestId });
      setTrades(tradesData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading backtest trades:', error);
      setError('Failed to load backtest trades. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle backtest creation
  const handleCreateBacktest = async () => {
    if (!backtestForm.name) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create new backtest
      const newBacktest = await db.createBacktest({
        name: backtestForm.name,
        confluences: backtestForm.confluences
      });
      
      // Update backtests list
      setBacktests([...backtests, newBacktest]);
      
      // Select new backtest
      setSelectedBacktest(newBacktest);
      
      // Reset form
      setBacktestForm({
        name: '',
        confluences: []
      });
      
      // Close dialog
      setCreateDialogOpen(false);
      
      // Load trades (should be empty for new backtest)
      setTrades([]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating backtest:', error);
      setError('Failed to create backtest. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle backtest form changes
  const handleBacktestFormChange = (event) => {
    const { name, value } = event.target;
    setBacktestForm({
      ...backtestForm,
      [name]: value
    });
  };
  
  // Handle confluences selection changes
  const handleConfluencesChange = (event) => {
    const {
      target: { value },
    } = event;
    setBacktestForm({
      ...backtestForm,
      confluences: typeof value === 'string' ? value.split(',') : value
    });
  };
  
  // Handle trade creation
  const handleTradeCreate = async (tradeData) => {
    if (!selectedBacktest) {
      setError('Please select or create a backtest first.');
      return;
    }
    
    try {
      // Add backtest ID to trade data
      const newTradeData = {
        ...tradeData,
        backtest_id: selectedBacktest.id
      };
      
      const newTrade = await db.createTrade(newTradeData);
      setTrades([newTrade, ...trades]);
      return newTrade;
    } catch (error) {
      console.error('Error creating trade:', error);
      setError('Failed to create trade. Please try again.');
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
      
      return updatedTrade;
    } catch (error) {
      console.error('Error updating trade:', error);
      setError('Failed to update trade. Please try again.');
      throw error;
    }
  };
  
  // Handle trade deletion
  const handleTradeDelete = async (id) => {
    try {
      await db.deleteTrade(id);
      
      setTrades(trades.filter((trade) => trade.id !== id));
    } catch (error) {
      console.error('Error deleting trade:', error);
      setError('Failed to delete trade. Please try again.');
      throw error;
    }
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };
  
  // Show loading state
  if (isLoading && (dbLoading || settingsLoading)) {
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
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4">Backtest</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* View mode buttons */}
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => handleViewModeChange('table')}
              >
                Table View
              </Button>
              <Button
                variant={viewMode === 'documentation' ? 'contained' : 'outlined'}
                onClick={() => handleViewModeChange('documentation')}
              >
                Documentation View
              </Button>
              <Button
                variant={viewMode === 'performance' ? 'contained' : 'outlined'}
                onClick={() => handleViewModeChange('performance')}
              >
                Performance Report
              </Button>
              
              <Divider orientation="vertical" flexItem />
              
              {/* Filter button */}
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterDialogOpen(true)}
              >
                Filters
              </Button>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle1">Backtest:</Typography>
              <FormControl sx={{ minWidth: 250 }}>
                <Select
                  value={selectedBacktest ? selectedBacktest.id : ''}
                  onChange={handleBacktestChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select Backtest
                  </MenuItem>
                  {backtests.map((backtest) => (
                    <MenuItem key={backtest.id} value={backtest.id}>
                      {backtest.name}
                    </MenuItem>
                  ))}
                  <MenuItem value="new">
                    <Typography color="primary">
                      <AddIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Create New Backtest
                    </Typography>
                  </MenuItem>
                </Select>
              </FormControl>
              
              {selectedBacktest && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleTradeCreate({
                    date: new Date().toISOString().split('T')[0],
                    backtest_id: selectedBacktest.id
                  })}
                >
                  Add Trade
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
        
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
            
            {viewMode === 'table' && (
              <BacktestTable
                trades={trades}
                onUpdate={handleTradeUpdate}
                onDelete={handleTradeDelete}
              />
            )}
            
            {viewMode === 'documentation' && (
              <DocumentationView
                trades={trades}
              />
            )}
            
            {viewMode === 'performance' && (
              <PerformanceReport
                trades={trades}
                filter={selectedTab > 0 ? filters[selectedTab - 1] : null}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Create Backtest Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Backtest</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a name for your new backtest and select the confluences that apply.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Backtest Name"
            fullWidth
            value={backtestForm.name}
            onChange={handleBacktestFormChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel id="confluences-label">Confluences</InputLabel>
            <Select
              labelId="confluences-label"
              id="confluences"
              multiple
              value={backtestForm.confluences}
              onChange={handleConfluencesChange}
              input={<OutlinedInput label="Confluences" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((confluenceId) => {
                    const confluence = confluences.find(c => c.id === confluenceId);
                    return (
                      <Chip key={confluenceId} label={confluence ? confluence.name : 'Unknown'} />
                    );
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {confluences.map((confluence) => (
                <MenuItem key={confluence.id} value={confluence.id}>
                  {confluence.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBacktest} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Filter Dialog */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Manage Filters</DialogTitle>
        <DialogContent>
          <Filters 
            filters={filters}
            onFiltersChange={setFilters}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Backtest;