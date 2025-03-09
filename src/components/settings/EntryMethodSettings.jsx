// src/components/settings/EntryMethodSettings.jsx
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

const EntryMethodSettings = () => {
  const { entryMethods, addEntryMethod, updateEntryMethod, deleteEntryMethod } = useSettings();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentEntryMethod, setCurrentEntryMethod] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  const initialFormState = {
    name: '',
    description: '',
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
      currentEntryMethod === null && 
      entryMethods.some(m => m.name.toLowerCase() === formState.name.trim().toLowerCase())
    ) {
      errors.name = 'Entry method with this name already exists';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle add
  const handleAdd = () => {
    setCurrentEntryMethod(null);
    setFormState(initialFormState);
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Handle edit
  const handleEdit = (entryMethod) => {
    setCurrentEntryMethod(entryMethod);
    setFormState({
      name: entryMethod.name,
      description: entryMethod.description || '',
      color: entryMethod.color
    });
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Handle delete
  const handleDelete = (entryMethod) => {
    setCurrentEntryMethod(entryMethod);
    setDeleteDialogOpen(true);
  };
  
  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (currentEntryMethod) {
        // Update existing entry method
        await updateEntryMethod(currentEntryMethod.id, {
          name: formState.name.trim(),
          description: formState.description.trim(),
          color: formState.color
        });
      } else {
        // Add new entry method
        await addEntryMethod({
          name: formState.name.trim(),
          description: formState.description.trim(),
          color: formState.color
        });
      }
      
      setDialogOpen(false);
      setFormState(initialFormState);
    } catch (error) {
      console.error('Error saving entry method:', error);
      // Show error in form
      setFormErrors({
        ...formErrors,
        general: 'Error saving entry method. Please try again.'
      });
    }
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!currentEntryMethod) return;
    
    try {
      await deleteEntryMethod(currentEntryMethod.id);
      setDeleteDialogOpen(false);
      setCurrentEntryMethod(null);
    } catch (error) {
      console.error('Error deleting entry method:', error);
      // Show error
      setFormErrors({
        ...formErrors,
        general: 'Error deleting entry method. Please try again.'
      });
    }
  };
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Entry Methods
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Entry Method
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Color</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entryMethods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Alert severity="info">
                    No entry methods found. Click the "Add Entry Method" button to create one.
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              entryMethods.map((entryMethod) => (
                <TableRow key={entryMethod.id}>
                  <TableCell component="th" scope="row">
                    {entryMethod.name}
                  </TableCell>
                  <TableCell>{entryMethod.description}</TableCell>
                  <TableCell align="center">
                    <Box 
                      sx={{ 
                        width: 30, 
                        height: 30, 
                        borderRadius: '50%', 
                        bgcolor: entryMethod.color,
                        mx: 'auto',
                        border: '1px solid #ddd'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEdit(entryMethod)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(entryMethod)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {currentEntryMethod ? 'Edit Entry Method' : 'Add Entry Method'}
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
                label="Entry Method Name"
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
                label="Description"
                name="description"
                value={formState.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
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
            Are you sure you want to delete the entry method "{currentEntryMethod?.name}"? 
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

export default EntryMethodSettings;