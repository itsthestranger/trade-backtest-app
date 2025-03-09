// src/components/trades/TradeDocumentation.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  IconButton,
  Paper
} from '@mui/material';
import { Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';

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

// Body & Mind states
const bodyMindStates = [
  'Alcohol',
  'Bad Sleep',
  'Calm',
  'Fit',
  'Good Sleep',
  'Gym',
  'Impatient',
  'Meditation',
  'Nervous',
  'Physical Exercise',
  'Stressed',
  'Tired',
  'Sick'
];

const TradeDocumentation = ({ trade, onUpdate, onClose }) => {
  const { confluences, isLoading } = useSettings();
  
  // Form state
  const [formState, setFormState] = useState({
    confluences: [],
    trade_journal: '',
    body_mind_state: [],
    planned_executed: 'Planned'
  });
  
  // Load trade documentation data
  useEffect(() => {
    if (trade && !isLoading) {
      // Initialize form state from trade data
      const tradeConfluences = (trade.confluences || []).map(c => c.id);
      const documentation = trade.documentation || {};
      const bodyMindState = documentation.body_mind_state ? 
        documentation.body_mind_state.split(',') : [];
      
      setFormState({
        confluences: tradeConfluences,
        trade_journal: documentation.trade_journal || '',
        body_mind_state: bodyMindState,
        planned_executed: trade.planned_executed || 'Planned'
      });
    }
  }, [trade, isLoading]);

  // Handle form changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value
    });
  };

  // Handle body & mind state changes
  const handleBodyMindChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormState({
      ...formState,
      body_mind_state: typeof value === 'string' ? value.split(',') : value
    });
  };

  // Handle confluences changes
  const handleConfluencesChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormState({
      ...formState,
      confluences: typeof value === 'string' ? value.split(',') : value
    });
  };

  // Handle planned/executed switch
  const handleStatusChange = (event) => {
    setFormState({
      ...formState,
      planned_executed: event.target.checked ? 'Executed' : 'Planned'
    });
  };

  // Handle save
  const handleSave = async () => {
    try {
      // Prepare update data
      const updateData = {
        confluences: formState.confluences,
        trade_journal: formState.trade_journal,
        body_mind_state: formState.body_mind_state.join(','),
        planned_executed: formState.planned_executed
      };
      
      await onUpdate(trade.id, updateData);
      
      // Show success message or close
      onClose();
    } catch (error) {
      console.error('Error saving trade documentation:', error);
      // Show error message
    }
  };

  // Show loading state or no trade selected
  if (isLoading || !trade) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={0}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Trade Documentation: {trade.instrument_name} {trade.direction} ({trade.date})
          </Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{ mr: 1 }}
            >
              Save
            </Button>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          {/* Planned/Executed Switch */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formState.planned_executed === 'Executed'}
                  onChange={handleStatusChange}
                  name="status_switch"
                  color="primary"
                />
              }
              label={`Status: ${formState.planned_executed}`}
            />
          </Grid>
          
          {/* Confluences */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="confluences-label">Confluences</InputLabel>
              <Select
                labelId="confluences-label"
                id="confluences"
                name="confluences"
                multiple
                value={formState.confluences}
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
          </Grid>
          
          {/* Body & Mind State */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="body-mind-label">Body & Mind State</InputLabel>
              <Select
                labelId="body-mind-label"
                id="body_mind_state"
                name="body_mind_state"
                multiple
                value={formState.body_mind_state}
                onChange={handleBodyMindChange}
                input={<OutlinedInput label="Body & Mind State" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((state) => (
                      <Chip key={state} label={state} />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {bodyMindStates.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Trade Journal */}
          <Grid item xs={12}>
            <TextField
              id="trade_journal"
              name="trade_journal"
              label="Trade Journal"
              multiline
              rows={6}
              fullWidth
              value={formState.trade_journal}
              onChange={handleChange}
              placeholder="Enter your trade notes, analysis, and reflections here..."
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default TradeDocumentation;