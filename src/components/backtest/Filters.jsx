// src/components/backtest/Filters.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  RadioGroup,
  Radio,
  FormControlLabel,
  Divider,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useDatabase } from '../../contexts/DatabaseContext';
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

const Filters = ({ filters, onFiltersChange }) => {
  const { db } = useDatabase();
  const { instruments, entryMethods, accounts, confluences } = useSettings();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState(null);
  
  // Initialize form state for new filter
  const emptyFilter = {
    name: '',
    date_from: '',
    date_to: '',
    session: '',
    instrument_id: '',
    entry_method_id: '',
    account_id: '',
    average_metrics_from: 0,
    average_metrics_to: 10,
    confluences: [],
    confluences_logic: 'AND',
    execution_status: '',
    confirmation_type: '',
    direction: '',
    status: '',
    days: [],
    stop_ticks_from: '',
    stop_ticks_to: ''
  };
  
  const [formState, setFormState] = useState(emptyFilter);
  
  // Handle form changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value
    });
  };
  
  // Handle multi-select changes
  const handleMultiSelectChange = (event) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: typeof value === 'string' ? value.split(',') : value
    });
  };
  
  // Handle slider changes
  const handleSliderChange = (name) => (event, newValue) => {
    setFormState({
      ...formState,
      [`${name}_from`]: newValue[0],
      [`${name}_to`]: newValue[1]
    });
  };
  
  // Handle add new filter
  const handleAddFilter = async () => {
    try {
      // Validate form
      if (!formState.name) {
        alert('Please enter a filter name');
        return;
      }
      
      // Create new filter
      const newFilter = await db.createFilter(formState);
      
      // Update filters list
      onFiltersChange([...filters, newFilter]);
      
      // Reset form
      setFormState(emptyFilter);
      
      // Close dialog
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error creating filter:', error);
    }
  };
  
  // Handle edit filter
  const handleEditFilter = (filter) => {
    setCurrentFilter(filter);
    setFormState({
      ...filter,
      // Ensure arrays are properly initialized
      confluences: filter.confluences || [],
      days: filter.days ? (typeof filter.days === 'string' ? filter.days.split(',') : filter.days) : []
    });
    setEditDialogOpen(true);
  };
  
  // Handle update filter
  const handleUpdateFilter = async () => {
    try {
      // Validate form
      if (!formState.name) {
        alert('Please enter a filter name');
        return;
      }
      
      // Update filter
      const updatedFilter = await db.updateFilter(currentFilter.id, formState);
      
      // Update filters list
      onFiltersChange(
        filters.map(filter => filter.id === currentFilter.id ? updatedFilter : filter)
      );
      
      // Reset form and current filter
      setFormState(emptyFilter);
      setCurrentFilter(null);
      
      // Close dialog
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating filter:', error);
    }
  };
  
  // Handle delete filter
  const handleDeleteFilter = (filter) => {
    setCurrentFilter(filter);
    setDeleteDialogOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    try {
      // Delete filter
      await db.deleteFilter(currentFilter.id);
      
      // Update filters list
      onFiltersChange(filters.filter(filter => filter.id !== currentFilter.id));
      
      // Reset current filter
      setCurrentFilter(null);
      
      // Close dialog
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Saved Filters</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCurrentFilter(null);
            setFormState(emptyFilter);
            setEditDialogOpen(true);
          }}
        >
          Create New Filter
        </Button>
      </Box>
      
      {filters.length === 0 ? (
        <Typography variant="body1" sx={{ my: 4, textAlign: 'center' }}>
          No filters created yet. Click the button above to create your first filter.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filters.map((filter) => (
            <Grid item xs={12} md={6} key={filter.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {filter.name}
                  </Typography>
                  
                  <Grid container spacing={1}>
                    {filter.date_from && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Date From: {filter.date_from}
                        </Typography>
                      </Grid>
                    )}
                    
                    {filter.date_to && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Date To: {filter.date_to}
                        </Typography>
                      </Grid>
                    )}
                    
                    {filter.session && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Session: {filter.session}
                        </Typography>
                      </Grid>
                    )}
                    
                    {filter.instrument_id && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Instrument: {instruments.find(i => i.id === filter.instrument_id)?.name || 'Unknown'}
                        </Typography>
                      </Grid>
                    )}
                    
                    {filter.entry_method_id && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Entry Method: {entryMethods.find(m => m.id === filter.entry_method_id)?.name || 'Unknown'}
                        </Typography>
                      </Grid>
                    )}
                    
                    {filter.account_id && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Account: {accounts.find(a => a.id === filter.account_id)?.name || 'Unknown'}
                        </Typography>
                      </Grid>
                    )}
                    
                    {(filter.average_metrics_from !== undefined || filter.average_metrics_to !== undefined) && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Average Metrics: {filter.average_metrics_from || 0} - {filter.average_metrics_to || 10}
                        </Typography>
                      </Grid>
                    )}
                    
                    {filter.confluences && filter.confluences.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Confluences ({filter.confluences_logic}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {filter.confluences.map(id => {
                            const confluence = confluences.find(c => c.id === id);
                            return (
                              <Chip 
                                key={id} 
                                label={confluence?.name || 'Unknown'} 
                                size="small" 
                                variant="outlined"
                              />
                            );
                          })}
                        </Box>
                      </Grid>
                    )}
                    
                    {filter.execution_status && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Execution Status: {filter.execution_status}
                        </Typography>
                      </Grid>
                    )}
                    
                    {filter.confirmation_type && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Confirmation Type: {filter.confirmation_type}
                        </Typography>
                      </Grid>
                    )}
                    
                    {filter.direction && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Direction: {filter.direction}
                        </Typography>
                      </Grid>
                    )}
                    
                    {filter.status && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Status: {filter.status}
                        </Typography>
                      </Grid>
                    )}
                    
                    {filter.days && filter.days.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Days: {Array.isArray(filter.days) ? filter.days.join(', ') : filter.days}
                        </Typography>
                      </Grid>
                    )}
                    
                    {(filter.stop_ticks_from !== undefined && filter.stop_ticks_from !== '' || 
                     filter.stop_ticks_to !== undefined && filter.stop_ticks_to !== '') && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Stop Ticks: {filter.stop_ticks_from || '0'} - {filter.stop_ticks_to || 'Max'}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditFilter(filter)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleDeleteFilter(filter)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Edit/Create Filter Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {currentFilter ? `Edit Filter: ${currentFilter.name}` : 'Create New Filter'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Filter Name"
                name="name"
                value={formState.name}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Date From"
                name="date_from"
                type="date"
                value={formState.date_from}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Date To"
                name="date_to"
                type="date"
                value={formState.date_to}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Session</InputLabel>
                <Select
                  name="session"
                  value={formState.session}
                  onChange={handleChange}
                  label="Session"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="ODR">ODR</MenuItem>
                  <MenuItem value="RDR">RDR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Instrument</InputLabel>
                <Select
                  name="instrument_id"
                  value={formState.instrument_id}
                  onChange={handleChange}
                  label="Instrument"
                >
                  <MenuItem value="">Any</MenuItem>
                  {instruments.map((instrument) => (
                    <MenuItem key={instrument.id} value={instrument.id}>
                      {instrument.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Entry Method</InputLabel>
                <Select
                  name="entry_method_id"
                  value={formState.entry_method_id}
                  onChange={handleChange}
                  label="Entry Method"
                >
                  <MenuItem value="">Any</MenuItem>
                  {entryMethods.map((method) => (
                    <MenuItem key={method.id} value={method.id}>
                      {method.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  name="account_id"
                  value={formState.account_id}
                  onChange={handleChange}
                  label="Account"
                >
                  <MenuItem value="">Any</MenuItem>
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>Average Metrics Score</Typography>
              <Slider
                value={[
                  formState.average_metrics_from !== undefined ? formState.average_metrics_from : 0,
                  formState.average_metrics_to !== undefined ? formState.average_metrics_to : 10
                ]}
                onChange={handleSliderChange('average_metrics')}
                valueLabelDisplay="auto"
                min={0}
                max={10}
                step={0.5}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Confluences</InputLabel>
                <Select
                  name="confluences"
                  multiple
                  value={formState.confluences}
                  onChange={handleMultiSelectChange}
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
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography>Confluences Logic</Typography>
                <RadioGroup
                  row
                  name="confluences_logic"
                  value={formState.confluences_logic}
                  onChange={handleChange}
                >
                  <FormControlLabel value="AND" control={<Radio />} label="AND (all must match)" />
                  <FormControlLabel value="OR" control={<Radio />} label="OR (any can match)" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Execution Status</InputLabel>
                <Select
                  name="execution_status"
                  value={formState.execution_status}
                  onChange={handleChange}
                  label="Execution Status"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="Planned">Planned</MenuItem>
                  <MenuItem value="Executed">Executed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Confirmation Type</InputLabel>
                <Select
                  name="confirmation_type"
                  value={formState.confirmation_type}
                  onChange={handleChange}
                  label="Confirmation Type"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="Wick Confirmation">Wick Confirmation</MenuItem>
                  <MenuItem value="Full Confirmation">Full Confirmation</MenuItem>
                  <MenuItem value="Early Indication">Early Indication</MenuItem>
                  <MenuItem value="No Confirmation">No Confirmation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Direction</InputLabel>
                <Select
                  name="direction"
                  value={formState.direction}
                  onChange={handleChange}
                  label="Direction"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="Long">Long</MenuItem>
                  <MenuItem value="Short">Short</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formState.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="Winner">Winner</MenuItem>
                  <MenuItem value="Expense">Expense</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Days</InputLabel>
                <Select
                  name="days"
                  multiple
                  value={formState.days}
                  onChange={handleMultiSelectChange}
                  input={<OutlinedInput label="Days" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((day) => (
                        <Chip key={day} label={day} />
                      ))}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="Mon">Monday</MenuItem>
                  <MenuItem value="Tue">Tuesday</MenuItem>
                  <MenuItem value="Wed">Wednesday</MenuItem>
                  <MenuItem value="Thu">Thursday</MenuItem>
                  <MenuItem value="Fri">Friday</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Stop Ticks From"
                name="stop_ticks_from"
                type="number"
                value={formState.stop_ticks_from}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Stop Ticks To"
                name="stop_ticks_to"
                type="number"
                value={formState.stop_ticks_to}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          {currentFilter ? (
            <Button
              onClick={handleUpdateFilter}
              color="primary"
              variant="contained"
              startIcon={<SaveIcon />}
            >
              Update Filter
            </Button>
          ) : (
            <Button
              onClick={handleAddFilter}
              color="primary"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Create Filter
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the filter "{currentFilter?.name}"? This action cannot be undone.
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

export default Filters;