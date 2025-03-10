// src/components/trades/TradePlanner/PositionCalculator.jsx
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  InputAdornment,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { 
  Calculate as CalculateIcon,
  ArrowUpward as LongIcon,
  ArrowDownward as ShortIcon
} from '@mui/icons-material';
import { useSettings } from '../../../contexts/SettingsContext';
import { useDatabase } from '../../../contexts/DatabaseContext';

const PositionCalculator = ({ instrumentId, onChange, position }) => {
  const { accounts, isLoading: settingsLoading } = useSettings();
  const { db, isLoading: dbLoading } = useDatabase();
  
  const [instrumentDetails, setInstrumentDetails] = useState(null);
  const [formState, setFormState] = useState({
    accountId: position.accountId || '',
    accountSize: position.accountSize || 0,
    riskPercent: position.riskPercent || 1,
    stopTicks: position.stopTicks || 0,
    entry: position.entry || 0,
    stop: position.stop || 0,
    target: position.target || 0,
    entryTime: position.entryTime || ''
  });
  
  const [contracts, setContracts] = useState(0);
  const [rValue, setRValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load instrument details
  useEffect(() => {
    const loadInstrumentDetails = async () => {
      if (!instrumentId || settingsLoading || dbLoading) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get instrument details
        const instruments = await db.getInstruments();
        const instrument = instruments.find(i => i.id === instrumentId);
        
        if (instrument) {
          setInstrumentDetails(instrument);
        } else {
          setError('Instrument not found');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading instrument details:', error);
        setError('Failed to load instrument details');
        setIsLoading(false);
      }
    };
    
    loadInstrumentDetails();
  }, [instrumentId, db, settingsLoading, dbLoading]);
  
  // Calculate contracts and R-value
  useEffect(() => {
    if (!instrumentDetails) return;
    
    // Get selected account
    const account = accounts.find(a => a.id === formState.accountId);
    
    if (!account) return;
    
    // Set risk percent from account if not already set
    if (formState.riskPercent !== account.risk_per_r) {
      setFormState(prevState => ({
        ...prevState,
        riskPercent: account.risk_per_r
      }));
      return; // Let the next effect run handle the calculation
    }
    
    // Calculate contracts based on risk
    const riskAmount = formState.accountSize * (formState.riskPercent / 100);
    const tickValue = instrumentDetails.tick_value;
    const dollarsPerTick = instrumentDetails.dollars_per_tick;
    
    let calculatedContracts = 0;
    
    if (formState.stopTicks > 0 && dollarsPerTick > 0) {
      // Updated formula: (Account Size * Risk %) / (Stop Ticks * $ per Tick)
      calculatedContracts = Math.floor(riskAmount / (formState.stopTicks * dollarsPerTick));
    }
    
    // Calculate R-value
    let calculatedRValue = 0;
    
    if (formState.entry > 0 && formState.stop > 0 && formState.target > 0) {
      const entryToStop = Math.abs(formState.entry - formState.stop);
      const entryToTarget = Math.abs(formState.target - formState.entry);
      
      if (entryToStop > 0) {
        calculatedRValue = entryToTarget / entryToStop;
      }
    }
    
    setContracts(calculatedContracts);
    setRValue(calculatedRValue);
    
    // Update parent component
    onChange({
      ...formState,
      contracts: calculatedContracts,
      rValue: calculatedRValue
    });
  }, [formState, instrumentDetails, accounts, onChange]);

  
  // Handle form changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    
    // Convert numeric values
    let parsedValue = value;
    if (['accountSize', 'riskPercent', 'stopTicks', 'entry', 'stop', 'target'].includes(name)) {
      parsedValue = parseFloat(value) || 0;
    }
    
    // Special handling for entry/stop/target to recalculate stop ticks
    if (['entry', 'stop'].includes(name) && instrumentDetails) {
      const newState = {
        ...formState,
        [name]: parsedValue
      };
      
      // Recalculate stop ticks if both entry and stop are valid
      if (newState.entry > 0 && newState.stop > 0) {
        newState.stopTicks = Math.abs(
          Math.round((newState.entry - newState.stop) / instrumentDetails.tick_value)
        );
      }
      
      setFormState(newState);
    } else if (name === 'stopTicks' && instrumentDetails && formState.entry > 0) {
      // Recalculate stop price based on entry and stop ticks
      const tickValue = instrumentDetails.tick_value;
      // Determine direction: if long, stop is below entry; if short, stop is above entry
      const isLong = formState.target > formState.entry; // Assume long if target > entry
      const stopPrice = isLong 
        ? formState.entry - (parsedValue * tickValue)
        : formState.entry + (parsedValue * tickValue);
      
      setFormState({
        ...formState,
        stopTicks: parsedValue,
        stop: stopPrice
      });
    } else if (name === 'accountId' && accounts.length > 0) {
      // Update account size and risk percent when account changes
      const account = accounts.find(a => a.id === parsedValue);
      
      if (account) {
        setFormState({
          ...formState,
          accountId: parsedValue,
          accountSize: account.size,
          riskPercent: account.risk_per_r // Auto-fill risk percent from account
        });
      } else {
        setFormState({
          ...formState,
          [name]: parsedValue
        });
      }
    } else {
      setFormState({
        ...formState,
        [name]: parsedValue
      });
    }
  };
  
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Position Calculator
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Account and Risk Settings */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Account & Risk Settings
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  name="accountId"
                  value={formState.accountId}
                  onChange={handleChange}
                  label="Account"
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Account Size"
                name="accountSize"
                type="number"
                value={formState.accountSize}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Risk %"
                name="riskPercent"
                type="number"
                value={formState.riskPercent}
                onChange={handleChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Stop Ticks"
                name="stopTicks"
                type="number"
                value={formState.stopTicks}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </Grid>
        
        {/* Position Details */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Position Details
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Entry Time"
                name="entryTime"
                type="time"
                value={formState.entryTime}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Entry"
                name="entry"
                type="number"
                value={formState.entry}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Stop"
                name="stop"
                type="number"
                value={formState.stop}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Target"
                name="target"
                type="number"
                value={formState.target}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        {/* Results */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Card sx={{ minWidth: 200, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Contracts
                </Typography>
                <Typography variant="h4">
                  {contracts}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ minWidth: 200, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {formState.target > formState.entry ? (
                    <LongIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  ) : (
                    <ShortIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  )}
                  Potential R
                </Typography>
                <Typography variant="h4">
                  {rValue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
            
            {instrumentDetails && (
              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Instrument
                  </Typography>
                  <Typography variant="h4">
                    {instrumentDetails.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tick Value: {instrumentDetails.tick_value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    $ per Tick: ${instrumentDetails.dollars_per_tick}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PositionCalculator;