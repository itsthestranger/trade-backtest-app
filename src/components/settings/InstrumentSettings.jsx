// src/components/settings/InstrumentSettings.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';
import { MuiColorInput } from 'mui-color-input';

const InstrumentSettings = () => {
  const { instruments, addInstrument, updateInstrument, deleteInstrument } = useSettings();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentInstrument, setCurrentInstrument] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  const initialFormState = {
    name: '',
    tick_value: '',
    color: '#1976d2'
  };
  
  const [formState, setFormState] = useState(initialFormState);
  
  // Handle form changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    
    setFormState({
      ...formState,
      [name]: value
    });
    
    // Clear error for the field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Handle color change
  const handleColorChange = (newColor) => {
    setFormState({
      ...formState,
      color: newColor
    });
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formState.name.trim()) {
      errors.name = 'Name is required';
    } else if (
      currentInstrument === null && 
      instruments.some(i => i.name.toLowerCase() === formState.name.trim().toLowerCase())
    ) {
      errors.name = 'Instrument with this name already exists';
    }
    
    if (!formState.tick_value || isNaN(formState.tick_value)) {
      errors.tick_value = 'Tick value must be a number';
    } else if (parseFloat(formState.tick_value) <= 0) {
      errors.tick_value = 'Tick value must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle add
  const handleAdd = () => {
    setCurrentInstrument(null);
    setFormState(initialFormState);
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Handle edit
  const handleEdit = (instrument) => {
    setCurrentInstrument(instrument);
    setFormState({
      name: instrument.name,
      tick_value: instrument.tick_value.toString(),
      color: instrument.color
    });
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Handle delete
  const handleDelete = (instrument) => {
    setCurrentInstrument(instrument);
    setDeleteDialogOpen(true);
  };
  
  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (currentInstrument) {
        // Update existing instrument
        await updateInstrument(currentInstrument.id, {
          name: formState.name.trim(),
          tick_value: parseFloat(formState.tick_value),
          color: formState.color
        });
      } else {
        // Add new instrument
        await addInstrument({
          name: formState.name.trim(),
          tick_value: parseFloat(formState.tick_value),
          color: formState.color
        });
      }
      
      setDialogOpen(false);
      setFormState(initialFormState);
    } catch (error) {
      console.error('Error saving instrument:', error);
      // Show error in form
      setFormErrors({
        ...formErrors,
        general: 'Error saving instrument. Please try again.'
      });
    }
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!currentInstrument) return;
    
    try {
      await deleteInstrument(currentInstrument.id);
      setDeleteDialogOpen(false);
      setCurrentInstrument(null);
    } catch (error) {
      console.error('Error deleting instrument:', error);
      // Show error
      setFormErrors({
        ...formErrors,
        general: 'Error deleting instrument. Please try again.'
      });
    }
  };
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Instruments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Instrument
        </Button>
      </Box>
      
      {instruments.length === 0 ? (
        <Alert severity="info">
          No instruments defined yet. Click the "Add Instrument" button to create your first instrument.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Tick Value</TableCell>
                <TableCell align="center">Color</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instruments.map((instrument) => (
                <TableRow key={instrument.id}>
                  <TableCell component="th" scope="row">
                    {instrument.name}
                  </TableCell>
                  <TableCell align="right">{instrument.tick_value}</TableCell>
                  <TableCell align="center">
                    <Box 
                      sx={{ 
                        width: 30, 
                        height: 30, 
                        borderRadius: '50%', 
                        bgcolor: instrument.color,
                        mx: 'auto',
                        border: '1px solid #ddd'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEdit(instrument)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(instrument)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {currentInstrument ? 'Edit Instrument' : 'Add Instrument'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {formErrors.general && (
              <Grid item xs={12}>
                <Alert severity="error">{formErrors.general}</Alert>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                label="Instrument Name"
                name="name"
                value={formState.name}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Tick Value per 1 Unit"
                name="tick_value"
                type="number"
                value={formState.tick_value}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.tick_value}
                helperText={formErrors.tick_value}
                inputProps={{ step: 'any' }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Color
              </Typography>
              <MuiColorInput
                value={formState.color}
                onChange={handleColorChange}
                format="hex"
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            color="primary" 
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the instrument "{currentInstrument?.name}"? 
            This action cannot be undone and may affect existing trades and playbooks.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstrumentSettings;