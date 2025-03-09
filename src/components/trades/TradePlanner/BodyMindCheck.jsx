// src/components/trades/TradePlanner/BodyMindCheck.jsx
import React from 'react';
import {
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
  Chip,
  Grid
} from '@mui/material';

// Body & Mind states with categories
const bodyMindStates = [
  { name: 'Alcohol', category: 'negative' },
  { name: 'Bad Sleep', category: 'negative' },
  { name: 'Calm', category: 'positive' },
  { name: 'Fit', category: 'positive' },
  { name: 'Good Sleep', category: 'positive' },
  { name: 'Gym', category: 'positive' },
  { name: 'Impatient', category: 'negative' },
  { name: 'Meditation', category: 'positive' },
  { name: 'Nervous', category: 'negative' },
  { name: 'Physical Exercise', category: 'positive' },
  { name: 'Stressed', category: 'negative' },
  { name: 'Tired', category: 'negative' },
  { name: 'Sick', category: 'negative' }
];

const BodyMindCheck = ({ selectedStates, onChange }) => {
  // Handle checkbox change
  const handleChange = (event, stateName) => {
    if (event.target.checked) {
      // Add state
      onChange([...selectedStates, stateName]);
    } else {
      // Remove state
      onChange(selectedStates.filter(state => state !== stateName));
    }
  };
  
  // Group states by category
  const positiveStates = bodyMindStates.filter(state => state.category === 'positive');
  const negativeStates = bodyMindStates.filter(state => state.category === 'negative');
  
  // Count selected states by category
  const selectedPositive = selectedStates.filter(
    state => positiveStates.some(s => s.name === state)
  ).length;
  
  const selectedNegative = selectedStates.filter(
    state => negativeStates.some(s => s.name === state)
  ).length;
  
  // Determine overall status
  let overallStatus = 'neutral';
  let statusMessage = 'Select your current body & mind state';
  
  if (selectedPositive > 0 && selectedNegative === 0) {
    overallStatus = 'positive';
    statusMessage = 'Positive state - good for trading';
  } else if (selectedNegative > 0 && selectedPositive === 0) {
    overallStatus = 'negative';
    statusMessage = 'Negative state - consider avoiding trading';
  } else if (selectedPositive > 0 && selectedNegative > 0) {
    overallStatus = 'mixed';
    statusMessage = 'Mixed state - proceed with caution';
  }
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Body & Mind Check
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Overall State:
          </Typography>
          <Chip
            label={statusMessage}
            color={
              overallStatus === 'positive' ? 'success' :
              overallStatus === 'negative' ? 'error' :
              overallStatus === 'mixed' ? 'warning' : 'default'
            }
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedStates.map(state => (
            <Chip
              key={state}
              label={state}
              size="small"
              color={
                positiveStates.some(s => s.name === state) ? 'success' :
                negativeStates.some(s => s.name === state) ? 'error' : 'default'
              }
              onDelete={() => onChange(selectedStates.filter(s => s !== state))}
            />
          ))}
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Positive Factors
          </Typography>
          <FormGroup>
            {positiveStates.map((state) => (
              <FormControlLabel
                key={state.name}
                control={
                  <Checkbox
                    checked={selectedStates.includes(state.name)}
                    onChange={(event) => handleChange(event, state.name)}
                    name={`state-${state.name}`}
                    color="success"
                  />
                }
                label={state.name}
              />
            ))}
          </FormGroup>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Negative Factors
          </Typography>
          <FormGroup>
            {negativeStates.map((state) => (
              <FormControlLabel
                key={state.name}
                control={
                  <Checkbox
                    checked={selectedStates.includes(state.name)}
                    onChange={(event) => handleChange(event, state.name)}
                    name={`state-${state.name}`}
                    color="error"
                  />
                }
                label={state.name}
              />
            ))}
          </FormGroup>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default BodyMindCheck;