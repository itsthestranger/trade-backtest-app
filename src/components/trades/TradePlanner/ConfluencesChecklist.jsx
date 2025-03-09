// src/components/trades/TradePlanner/ConfluencesChecklist.jsx
import React from 'react';
import {
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Box,
  Divider
} from '@mui/material';
import { useSettings } from '../../../contexts/SettingsContext';

const ConfluencesChecklist = ({ selectedConfluences, onChange }) => {
  const { confluences, minConfluences, isLoading } = useSettings();
  
  // Handle checkbox change
  const handleChange = (event, confluenceId) => {
    if (event.target.checked) {
      // Add confluence
      onChange([...selectedConfluences, confluenceId]);
    } else {
      // Remove confluence
      onChange(selectedConfluences.filter(id => id !== confluenceId));
    }
  };
  
  // Check if minimum confluences requirement is met
  const isMinConfluencesMet = selectedConfluences.length >= minConfluences;
  
  // Show loading state
  if (isLoading) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Confluences Checklist
        </Typography>
        <Alert severity="info">Loading confluences...</Alert>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Confluences Checklist
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Alert severity={isMinConfluencesMet ? "success" : "warning"}>
          {isMinConfluencesMet 
            ? `Minimum confluences requirement met (${selectedConfluences.length}/${minConfluences})`
            : `Select at least ${minConfluences} confluences (${selectedConfluences.length} selected)`
          }
        </Alert>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <FormGroup>
        {confluences.map((confluence) => (
          <FormControlLabel
            key={confluence.id}
            control={
              <Checkbox
                checked={selectedConfluences.includes(confluence.id)}
                onChange={(event) => handleChange(event, confluence.id)}
                name={`confluence-${confluence.id}`}
              />
            }
            label={confluence.name}
          />
        ))}
      </FormGroup>
    </Paper>
  );
};

export default ConfluencesChecklist;