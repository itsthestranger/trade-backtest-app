// src/components/trades/TradePlanner/TradePlanner.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import { useSettings } from '../../../contexts/SettingsContext';
import { useDatabase } from '../../../contexts/DatabaseContext';
import EntryHeatmap from './EntryHeatmap';
import ConfluencesChecklist from './ConfluencesChecklist';
import BodyMindCheck from './BodyMindCheck';
import PlaybookHeatmap from './PlaybookHeatmap';
import PositionCalculator from './PositionCalculator';

const TradePlanner = ({ onCreateTrade, onClose }) => {
  const { instruments, isLoading: settingsLoading } = useSettings();
  const { db, isLoading: dbLoading } = useDatabase();
  
  // Form state
  const [formState, setFormState] = useState({
    instrument: '',
    confirmationType: '',
    direction: '',
    day: '',
    session: '',
    confirmationCandle: '',
    selectedConfluences: [],
    bodyMindState: [],
  });
  
  // Data state
  const [backtestData, setBacktestData] = useState(null);
  const [playbookData, setPlaybookData] = useState(null);
  const [entriesHeatmap, setEntriesHeatmap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Position calculator state
  const [position, setPosition] = useState({
    accountId: '',
    accountSize: 0,
    riskPercent: 1,
    stopTicks: 0,
    entry: 0,
    stop: 0,
    target: 0,
    contracts: 0
  });
  
  // Options for dropdowns
  const confirmationTypes = [
    'Wick Confirmation',
    'Full Confirmation',
    'Early Indication',
    'No Confirmation'
  ];
  
  const directions = ['Long', 'Short'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const sessions = ['ODR', 'RDR'];
  
  // Get confirmation candles based on session
  const getConfirmationCandles = () => {
    if (formState.session === 'ODR') {
      // Generate times from 4:00 to 8:25 in 5-minute intervals
      const candles = [];
      let hour = 4;
      let minute = 0;
      
      while (hour < 9 || (hour === 8 && minute <= 25)) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        candles.push(timeStr);
        
        minute += 5;
        if (minute >= 60) {
          minute = 0;
          hour += 1;
        }
      }
      
      return candles;
    } else if (formState.session === 'RDR') {
      // Generate times from 10:30 to 15:55 in 5-minute intervals
      const candles = [];
      let hour = 10;
      let minute = 30;
      
      while (hour < 16 || (hour === 15 && minute <= 55)) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        candles.push(timeStr);
        
        minute += 5;
        if (minute >= 60) {
          minute = 0;
          hour += 1;
        }
      }
      
      return candles;
    }
    
    return [];
  };
  
  // Handle form changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    
    setFormState(prevState => {
      const newState = {
        ...prevState,
        [name]: value
      };
      
      // Reset confirmation candle if session changes
      if (name === 'session') {
        newState.confirmationCandle = '';
      }
      
      return newState;
    });
    
    // Fetch data when selection changes
    if (['instrument', 'confirmationType', 'direction', 'day', 'session', 'confirmationCandle'].includes(name)) {
      fetchData();
    }
  };
  
  // Handle confluences changes
  const handleConfluencesChange = (selectedConfluences) => {
    setFormState(prevState => ({
      ...prevState,
      selectedConfluences
    }));
  };
  
  // Handle body & mind state changes
  const handleBodyMindChange = (bodyMindState) => {
    setFormState(prevState => ({
      ...prevState,
      bodyMindState
    }));
  };
  
  // Handle position calculator changes
  const handlePositionChange = (positionData) => {
    setPosition(positionData);
  };
  
  // Fetch data for heatmaps and playbook
  const fetchData = async () => {
    // Check if required fields are filled
    if (
      !formState.instrument ||
      !formState.confirmationType ||
      !formState.direction ||
      !formState.day ||
      !formState.session
    ) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get backtest data for entry heatmap
      const filter = {
        instrument_id: formState.instrument,
        confirmation_type: formState.confirmationType,
        direction: formState.direction,
        days: [formState.day],
        session: formState.session
      };
      
      const backtests = await db.getTrades(filter);
      setBacktestData(backtests);
      
      // Process data for entry heatmap
      if (backtests.length > 0) {
        const heatmapData = processDataForHeatmap(backtests);
        setEntriesHeatmap(heatmapData);
      } else {
        setEntriesHeatmap(null);
      }
      
      // Get playbook data if confirmation candle is also selected
      if (formState.confirmationCandle) {
        // Find playbook for the instrument
        const playbooks = await db.getPlaybooks();
        const instrumentPlaybooks = playbooks.filter(p => p.instrument_id === formState.instrument);
        
        if (instrumentPlaybooks.length > 0) {
          // Find matching playbook entry
          const playbook = instrumentPlaybooks[0];
          const playbookEntries = await db.getPlaybook(playbook.id);
          
          const matchingEntry = playbookEntries.entries.find(entry => 
            entry.day === formState.day &&
            entry.direction === formState.direction &&
            entry.confirmation_time === formState.confirmationCandle
          );
          
          setPlaybookData(matchingEntry || null);
        } else {
          setPlaybookData(null);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data for trade planner:', error);
      setError('Failed to load trade data. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Process backtest data for heatmap
  const processDataForHeatmap = (backtests) => {
    // Create a map of entry times to results
    const entryMap = {};
    
    // Get all possible entry times based on session
    const session = formState.session;
    const entryTimes = [];
    
    if (session === 'ODR') {
      // Generate times from 4:00 to 8:25 in 5-minute intervals
      let hour = 4;
      let minute = 0;
      
      while (hour < 9 || (hour === 8 && minute <= 25)) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        entryTimes.push(timeStr);
        entryMap[timeStr] = { trades: [], totalR: 0, winrate: 0 };
        
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
        entryTimes.push(timeStr);
        entryMap[timeStr] = { trades: [], totalR: 0, winrate: 0 };
        
        minute += 5;
        if (minute >= 60) {
          minute = 0;
          hour += 1;
        }
      }
    }
    
    // Group backtests by entry time
    backtests.forEach(trade => {
      const entryTime = trade.entry_time;
      
      if (entryMap[entryTime]) {
        entryMap[entryTime].trades.push(trade);
        entryMap[entryTime].totalR += trade.result || 0;
      }
    });
    
    // Calculate winrate and prepare final data
    Object.keys(entryMap).forEach(time => {
      const data = entryMap[time];
      const winners = data.trades.filter(t => t.status === 'Winner').length;
      data.winrate = data.trades.length > 0 ? (winners / data.trades.length) * 100 : 0;
    });
    
    // Find best entry time
    let bestEntryTime = null;
    let bestR = Number.NEGATIVE_INFINITY;
    
    Object.keys(entryMap).forEach(time => {
      const data = entryMap[time];
      if (data.totalR > bestR && data.trades.length > 0) {
        bestR = data.totalR;
        bestEntryTime = time;
      }
    });
    
    return {
      entryMap,
      bestEntryTime
    };
  };
  
  // Handle save as planned
  const handleSaveAsPlanned = async () => {
    try {
      const tradeData = {
        date: new Date().toISOString().split('T')[0],
        confirmation_time: formState.confirmationCandle,
        entry_time: position.entryTime || '',
        instrument_id: formState.instrument,
        confirmation_type: formState.confirmationType,
        direction: formState.direction,
        session: formState.session,
        entry_method_id: 1, // Default entry method, should be configurable
        stopped_out: false,
        status: 'Winner', // Default status, will be updated when executed
        entry: position.entry,
        stop: position.stop,
        target: position.target,
        account_id: position.accountId,
        confluences: formState.selectedConfluences,
        body_mind_state: formState.bodyMindState.join(','),
        planned_executed: 'Planned'
      };
      
      await onCreateTrade(tradeData);
      onClose();
    } catch (error) {
      console.error('Error saving planned trade:', error);
      setError('Failed to save trade. Please try again.');
    }
  };
  
  // Handle save as executed
  const handleSaveAsExecuted = async () => {
    try {
      const tradeData = {
        date: new Date().toISOString().split('T')[0],
        confirmation_time: formState.confirmationCandle,
        entry_time: position.entryTime || '',
        instrument_id: formState.instrument,
        confirmation_type: formState.confirmationType,
        direction: formState.direction,
        session: formState.session,
        entry_method_id: 1, // Default entry method, should be configurable
        stopped_out: false,
        status: 'Winner', // Default status, will be updated when executed
        entry: position.entry,
        stop: position.stop,
        target: position.target,
        account_id: position.accountId,
        confluences: formState.selectedConfluences,
        body_mind_state: formState.bodyMindState.join(','),
        planned_executed: 'Executed'
      };
      
      await onCreateTrade(tradeData);
      onClose();
    } catch (error) {
      console.error('Error saving executed trade:', error);
      setError('Failed to save trade. Please try again.');
    }
  };
  
  // Show loading state
  if (settingsLoading || dbLoading) {
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Trade Planner
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        {/* Top selection row */}
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Instrument</InputLabel>
            <Select
              name="instrument"
              value={formState.instrument}
              onChange={handleChange}
              label="Instrument"
            >
              {instruments.map((instrument) => (
                <MenuItem key={instrument.id} value={instrument.id}>
                  {instrument.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Confirmation Type</InputLabel>
            <Select
              name="confirmationType"
              value={formState.confirmationType}
              onChange={handleChange}
              label="Confirmation Type"
            >
              {confirmationTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Direction</InputLabel>
            <Select
              name="direction"
              value={formState.direction}
              onChange={handleChange}
              label="Direction"
            >
              {directions.map((direction) => (
                <MenuItem key={direction} value={direction}>
                  {direction}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Day</InputLabel>
            <Select
              name="day"
              value={formState.day}
              onChange={handleChange}
              label="Day"
            >
              {days.map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Session</InputLabel>
            <Select
              name="session"
              value={formState.session}
              onChange={handleChange}
              label="Session"
            >
              {sessions.map((session) => (
                <MenuItem key={session} value={session}>
                  {session}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Confirmation Candle</InputLabel>
            <Select
              name="confirmationCandle"
              value={formState.confirmationCandle}
              onChange={handleChange}
              label="Confirmation Candle"
              disabled={!formState.session}
            >
              {getConfirmationCandles().map((candle) => (
                <MenuItem key={candle} value={candle}>
                  {candle}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Entry heatmap */}
        <Grid item xs={12} md={6}>
          <EntryHeatmap 
            data={entriesHeatmap} 
            session={formState.session}
            isLoading={isLoading}
          />
        </Grid>
        
        {/* Confluences checklist */}
        <Grid item xs={12} md={6}>
          <ConfluencesChecklist 
            selectedConfluences={formState.selectedConfluences}
            onChange={handleConfluencesChange}
          />
        </Grid>
        
        {/* Body & Mind check */}
        <Grid item xs={12} md={6}>
          <BodyMindCheck 
            selectedStates={formState.bodyMindState}
            onChange={handleBodyMindChange}
          />
        </Grid>
        
        {/* Playbook heatmap */}
        <Grid item xs={12} md={6}>
          <PlaybookHeatmap 
            playbookData={playbookData}
            backtestData={backtestData}
            isLoading={isLoading}
          />
        </Grid>
        
        {/* Position calculator */}
        <Grid item xs={12}>
          <PositionCalculator 
            instrumentId={formState.instrument}
            onChange={handlePositionChange}
            position={position}
          />
        </Grid>
        
        {/* Action buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveAsPlanned}
              sx={{ mr: 2 }}
              disabled={!position.entry || !position.stop || !position.target}
            >
              Save as Planned
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSaveAsExecuted}
              disabled={!position.entry || !position.stop || !position.target}
            >
              Save as Executed
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TradePlanner;