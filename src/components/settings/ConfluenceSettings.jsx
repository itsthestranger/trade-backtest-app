// src/components/settings/ConfluenceSettings.jsx
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
  Slider,
  FormHelperText,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';

const ConfluenceSettings = () => {
  const { 
    confluences, 
    addConfluence, 
    updateConfluence, 
    deleteConfluence,
    minConfluences,
    updateMinConfluences
  } = useSettings();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentConfluence, setCurrentConfluence] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [tempMinConfluences, setTempMinConfluences] = useState(minConfluences);
  
  const initialFormState = {
    name: ''
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
  
  // Handle min confluences slider change
  const handleMinConfluencesChange = (event, newValue) => {
    setTempMinConfluences(newValue);
  };
  
  // Save min confluences
  const handleSaveMinConfluences = async () => {
    try {
      await updateMinConfluences(tempMinConfluences);
    } catch (error) {
      console.error('Error updating min confluences:', error);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formState.name.trim()) {
      errors.name = 'Name is required';
    } else if (
      currentConfluence === null && 
      confluences.some(c => c.name.toLowerCase() === formState.name.trim().toLowerCase())
    ) {
      errors.name = 'Confluence with this name already exists';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle add
  const handleAdd = () => {
    setCurrentConfluence(null);
    setFormState(initialFormState);
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Handle edit
  const handleEdit = (confluence) => {
    setCurrentConfluence(confluence);
    setFormState({
      name: confluence.name,
    });
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Handle delete
  const handleDelete = (confluence) => {
    setCurrentConfluence(confluence);
    setDeleteDialogOpen(true);
  };
  
  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (currentConfluence) {
        // Update existing confluence
        await updateConfluence(currentConfluence.id, {
          name: formState.name.trim(),
        });
      } else {
        // Add new confluence
        await addConfluence({
          name: formState.name.trim(),
        });
      }
      
      setDialogOpen(false);
      setFormState(initialFormState);
    } catch (error) {
      console.error('Error saving confluence:', error);
      // Show error in form
      setFormErrors({
        ...formErrors,
        general: 'Error saving confluence. Please try again.'
      });
    }
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!currentConfluence) return;
    
    try {
      await deleteConfluence(currentConfluence.id);
      setDeleteDialogOpen(false);
      setCurrentConfluence(null);
    } catch (error) {
      console.error('Error deleting confluence:', error);
      // Show error
      setFormErrors({
        ...formErrors,
        general: 'Error deleting confluence. Please try again.'
      });
    }
  };
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Confluences
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Confluence
        </Button>
      </Box>
      
      {/* Min Confluences Setting */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Minimum Confluences Required
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Set the minimum number of confluences required before executing a trade
          </Typography>
          
          <Box sx={{ px: 2, py: 1 }}>
            <Slider
              value={tempMinConfluences}
              onChange={handleMinConfluencesChange}
              onChangeCommitted={handleSaveMinConfluences}
              step={1}
              marks
              min={1}
              max={10}
              valueLabelDisplay="on"
            />
            <FormHelperText>
              Currently requiring at least {tempMinConfluences} confluence{tempMinConfluences > 1 ? 's' : ''}
            </FormHelperText>
          </Box>
        </CardContent>
      </Card>
      
      {confluences.length === 0 ? (
        <Alert severity="info">
          No confluences defined yet. Click the "Add Confluence" button to create your first confluence.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {confluences.map((confluence) => (
                <TableRow key={confluence.id}>
                  <TableCell component="th" scope="row">
                    {confluence.name}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEdit(confluence)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(confluence)}
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
          {currentConfluence ? 'Edit Confluence' : 'Add Confluence'}
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
                label="Confluence Name"
                name="name"
                value={formState.name}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
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
            Are you sure you want to delete the confluence "{currentConfluence?.name}"? 
            This action cannot be undone and may affect existing trades.
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

export default ConfluenceSettings;