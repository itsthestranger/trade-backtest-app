// src/components/settings/AccountSettings.jsx
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
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';
import { MuiColorInput } from 'mui-color-input';

const AccountSettings = () => {
  const { accounts, addAccount, updateAccount, deleteAccount } = useSettings();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  const initialFormState = {
    name: '',
    size: '',
    risk_per_r: '',
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
      currentAccount === null && 
      accounts.some(a => a.name.toLowerCase() === formState.name.trim().toLowerCase())
    ) {
      errors.name = 'Account with this name already exists';
    }
    
    if (!formState.size || isNaN(formState.size)) {
      errors.size = 'Account size must be a number';
    } else if (parseFloat(formState.size) <= 0) {
      errors.size = 'Account size must be greater than 0';
    }
    
    if (!formState.risk_per_r || isNaN(formState.risk_per_r)) {
      errors.risk_per_r = 'Risk percentage must be a number';
    } else if (parseFloat(formState.risk_per_r) <= 0 || parseFloat(formState.risk_per_r) > 100) {
      errors.risk_per_r = 'Risk percentage must be between 0 and 100';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle add
  const handleAdd = () => {
    setCurrentAccount(null);
    setFormState(initialFormState);
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Handle edit
  const handleEdit = (account) => {
    setCurrentAccount(account);
    setFormState({
      name: account.name,
      size: account.size.toString(),
      risk_per_r: account.risk_per_r.toString(),
      color: account.color
    });
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Handle delete
  const handleDelete = (account) => {
    setCurrentAccount(account);
    setDeleteDialogOpen(true);
  };
  
  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (currentAccount) {
        // Update existing account
        await updateAccount(currentAccount.id, {
          name: formState.name.trim(),
          size: parseFloat(formState.size),
          risk_per_r: parseFloat(formState.risk_per_r),
          color: formState.color
        });
      } else {
        // Add new account
        await addAccount({
          name: formState.name.trim(),
          size: parseFloat(formState.size),
          risk_per_r: parseFloat(formState.risk_per_r),
          color: formState.color
        });
      }
      
      setDialogOpen(false);
      setFormState(initialFormState);
    } catch (error) {
      console.error('Error saving account:', error);
      // Show error in form
      setFormErrors({
        ...formErrors,
        general: 'Error saving account. Please try again.'
      });
    }
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!currentAccount) return;
    
    try {
      await deleteAccount(currentAccount.id);
      setDeleteDialogOpen(false);
      setCurrentAccount(null);
    } catch (error) {
      console.error('Error deleting account:', error);
      // Show error
      setFormErrors({
        ...formErrors,
        general: 'Error deleting account. Please try again.'
      });
    }
  };
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Accounts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Account
        </Button>
      </Box>
      
      {accounts.length === 0 ? (
        <Alert severity="info">
          No accounts defined yet. Click the "Add Account" button to create your first account.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Account Size</TableCell>
                <TableCell align="right">Risk % Equaling 1R</TableCell>
                <TableCell align="center">Color</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell component="th" scope="row">
                    {account.name}
                  </TableCell>
                  <TableCell align="right">${account.size.toLocaleString()}</TableCell>
                  <TableCell align="right">{account.risk_per_r}%</TableCell>
                  <TableCell align="center">
                    <Box 
                      sx={{ 
                        width: 30, 
                        height: 30, 
                        borderRadius: '50%', 
                        bgcolor: account.color,
                        mx: 'auto',
                        border: '1px solid #ddd'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEdit(account)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(account)}
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
          {currentAccount ? 'Edit Account' : 'Add Account'}
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
                label="Account Name"
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
                label="Account Size"
                name="size"
                type="number"
                value={formState.size}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.size}
                helperText={formErrors.size}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Risk % Equaling 1R"
                name="risk_per_r"
                type="number"
                value={formState.risk_per_r}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.risk_per_r}
                helperText={formErrors.risk_per_r}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
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
            Are you sure you want to delete the account "{currentAccount?.name}"? 
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

export default AccountSettings;