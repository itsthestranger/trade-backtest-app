// src/components/trades/TradeTable.jsx - with enhanced inline editing
import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Tooltip,
  Snackbar,
  Alert,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography
} from '@mui/material';
import { 
  DataGrid, 
  GridActionsCellItem,
  GridEditSingleSelectCell
} from '@mui/x-data-grid';
import {
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  DescriptionOutlined as DocumentIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';

// Custom cell renderer for Stopped Out (Yes/No toggle)
const StoppedOutCell = (props) => {
  const { id, value, field, api } = props;
  const isChecked = value === 'Yes';
  
  return (
    <FormControlLabel
      control={
        <Switch
          checked={isChecked}
          onChange={(event) => {
            api.setEditCellValue({ id, field, value: event.target.checked ? 'Yes' : 'No' });
          }}
          size="small"
        />
      }
      label={value}
      sx={{ ml: 0 }}
    />
  );
};

const TradeTable = ({ trades, onSelect, onUpdate, onDelete }) => {
  const { instruments, entryMethods, isLoading } = useSettings();

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [rowIdToDelete, setRowIdToDelete] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // New state for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTrade, setCurrentTrade] = useState(null);

  // Handle view documentation
  const handleViewDocumentation = (trade) => {
    onSelect(trade);
  };

  // Handle edit - opens dialog instead of calling onSelect
  const handleEdit = (trade) => {
    setCurrentTrade(trade);
    setEditDialogOpen(true);
  };

  // Handle duplicate trade
  const handleDuplicate = (trade) => {
    // Create a duplicate trade by omitting id and modifying the date
    const { id, ...tradeToDuplicate } = trade;
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Create new trade object
    const newTrade = {
      ...tradeToDuplicate,
      date: today,
      // Reset specific fields that should not be duplicated
      exit: null,
      result: null,
      stopped_out: false,
      // Keep the same preparation, entry, etc. scores
    };
    
    // Call parent's onSelect with the new trade data
    onSelect(newTrade);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (id) => {
    setRowIdToDelete(id);
    setConfirmDeleteOpen(true);
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setRowIdToDelete(null);
    setConfirmDeleteOpen(false);
  };

  // Handle delete confirm
  const handleDeleteConfirmed = async () => {
    if (rowIdToDelete) {
      try {
        await onDelete(rowIdToDelete);
        setRowIdToDelete(null);
        setSnackbarMessage('Trade deleted successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        setSnackbarMessage('Error deleting trade');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
    setConfirmDeleteOpen(false);
  };

  // Handle cell edit
  const handleCellEditCommit = async (params) => {
    try {
      const { id, field, value } = params;
      
      // Find the original trade
      const trade = trades.find(t => t.id === id);
      if (!trade) return;

      // Format the value depending on the field type
      let formattedValue = value;
      
      // Handle date objects - convert to YYYY-MM-DD format
      if (field === 'date' && value instanceof Date) {
        formattedValue = value.toISOString().split('T')[0];
      }
      
      // Handle special fields that require different IDs
      let updateField = field;
      if (field === 'instrument') {
        updateField = 'instrument_id';
        // Find the instrument ID by name
        const instrument = instruments.find(i => i.name === value);
        if (instrument) {
          formattedValue = instrument.id;
        }
      } else if (field === 'entry_method') {
        updateField = 'entry_method_id';
        // Find the entry method ID by name
        const entryMethod = entryMethods.find(m => m.name === value);
        if (entryMethod) {
          formattedValue = entryMethod.id;
        }
      } else if (field === 'stopped_out') {
        formattedValue = value === 'True';
      }
      
      // Create an update object with just the changed field
      const updateData = { [updateField]: formattedValue };
      
      // Send the update to the backend
      await onUpdate(id, updateData);
      
      setSnackbarMessage('Trade updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating cell:', error);
      setSnackbarMessage('Error updating trade');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle form changes in edit dialog
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    
    // Special case for switch controls
    const newValue = event.target.type === 'checkbox' ? event.target.checked : value;
    
    setCurrentTrade({
      ...currentTrade,
      [name]: newValue
    });
  };

  // Handle save from edit dialog
  const handleSave = async () => {
    try {
      // Find the instrument to get tick value
      const instrument = instruments.find(i => i.id === currentTrade.instrument_id);
      if (!instrument) {
        setSnackbarMessage('Error: Could not find instrument');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      const tickValue = instrument.tick_value;
      
      // Get entry, stop, target values
      const entry = parseFloat(currentTrade.entry) || 0;
      const stop = parseFloat(currentTrade.stop) || 0;
      const target = parseFloat(currentTrade.target) || 0;
      const exit = parseFloat(currentTrade.exit) || null;
      
      // Calculate derived values
      let stopTicks = 0;
      if (entry && stop && tickValue) {
        stopTicks = Math.abs(entry - stop) / tickValue;
      }
      
      let potResult = 0;
      if (entry && stop && target && Math.abs(entry - stop) > 0) {
        potResult = Math.abs(target - entry) / Math.abs(entry - stop);
      }
      
      let result = null;
      if (entry && stop && exit && Math.abs(entry - stop) > 0) {
        result = (exit - entry) / Math.abs(entry - stop);
      }
      
      // Calculate average score if all scores are provided
      const preparation = parseFloat(currentTrade.preparation) || null;
      const entryScore = parseFloat(currentTrade.entry_score) || null;
      const stopLoss = parseFloat(currentTrade.stop_loss) || null;
      const targetScore = parseFloat(currentTrade.target_score) || null;
      const management = parseFloat(currentTrade.management) || null;
      const rules = parseFloat(currentTrade.rules) || null;
      
      let average = null;
      if (preparation && entryScore && stopLoss && targetScore && management && rules) {
        average = (preparation + entryScore + stopLoss + targetScore + management + rules) / 6;
      }
      
      // Prepare update data
      const updateData = {
        ...currentTrade,
        stop_ticks: stopTicks,
        pot_result: potResult,
        result,
        average
      };
      
      await onUpdate(currentTrade.id, updateData);
      setEditDialogOpen(false);
      setSnackbarMessage('Trade updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving trade:', error);
      setSnackbarMessage(`Error updating trade: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Define actions column
  const actionsColumn = {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    type: 'actions',
    getActions: (params) => [
      <GridActionsCellItem
        icon={<DocumentIcon />}
        label="Documentation"
        onClick={() => handleViewDocumentation(params.row.raw)}
      />,
      <GridActionsCellItem
        icon={<EditIcon />}
        label="Edit"
        onClick={() => handleEdit(params.row.raw)}
      />,
      <GridActionsCellItem
        icon={<DuplicateIcon />}
        label="Duplicate"
        onClick={() => handleDuplicate(params.row.raw)}
      />,
      <GridActionsCellItem
        icon={<DeleteIcon />}
        label="Delete"
        onClick={() => handleDeleteConfirm(params.row.id)}
        color="error"
      />
    ]
  };

  // Convert trades to rows
  const rows = trades.map((trade) => ({
    id: trade.id,
    day: trade.day,
    date: trade.date,
    confirmation_time: trade.confirmation_time,
    entry_time: trade.entry_time,
    instrument: trade.instrument_name,
    instrument_id: trade.instrument_id,
    confirmation_type: trade.confirmation_type,
    direction: trade.direction,
    session: trade.session,
    entry_method: trade.entry_method_name,
    entry_method_id: trade.entry_method_id,
    stopped_out: trade.stopped_out ? 'True' : 'False',
    status: trade.status,
    ret_entry: trade.ret_entry,
    sd_exit: trade.sd_exit,
    entry: trade.entry,
    stop: trade.stop,
    target: trade.target,
    exit: trade.exit,
    stop_ticks: trade.stop_ticks,
    pot_result: trade.pot_result,
    result: trade.result,
    preparation: trade.preparation,
    entry_score: trade.entry_score,
    stop_loss: trade.stop_loss,
    target_score: trade.target_score,
    management: trade.management,
    rules: trade.rules,
    average: trade.average,
    planned_executed: trade.planned_executed,
    // Reference to the original trade object
    raw: trade,
  }));

  // Define columns with enhanced inline editing
  const columns = [
    actionsColumn,
    { field: 'day', headerName: 'Day', width: 60 },
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 110, 
      editable: true, 
      type: 'date',
      valueGetter: (params) => {
        // Convert string date to Date object
        return params.value ? new Date(params.value) : null;
      }
    },
    { 
      field: 'confirmation_time', 
      headerName: 'Conf Time', 
      width: 100, 
      editable: true,
      type: 'string'
    },
    { 
      field: 'entry_time', 
      headerName: 'Entry Time', 
      width: 100, 
      editable: true,
      type: 'string'
    },
    { 
      field: 'instrument', 
      headerName: 'Instrument', 
      width: 130, 
      editable: true,
      type: 'singleSelect',
      valueOptions: instruments.map(i => i.name),
    },
    { 
      field: 'confirmation_type', 
      headerName: 'Conf Type', 
      width: 140, 
      editable: true,
      type: 'singleSelect',
      valueOptions: ['Wick Confirmation', 'Full Confirmation', 'Early Indication', 'No Confirmation'],
    },
    { 
      field: 'direction', 
      headerName: 'Direction', 
      width: 90, 
      editable: true,
      type: 'singleSelect',
      valueOptions: ['Long', 'Short'],
    },
    { 
      field: 'session', 
      headerName: 'Session', 
      width: 90, 
      editable: true,
      type: 'singleSelect',
      valueOptions: ['ODR', 'RDR'],
    },
    { 
      field: 'entry_method', 
      headerName: 'Entry Method', 
      width: 180, 
      editable: true,
      type: 'singleSelect',
      valueOptions: entryMethods.map(m => m.name),
    },
    { 
      field: 'stopped_out', 
      headerName: 'Stopped Out', 
      width: 120, 
      editable: true,
      type: 'singleSelect',
      valueOptions: ['True', 'False']
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 100, 
      editable: true,
      type: 'singleSelect',
      valueOptions: ['Winner', 'Expense', 'Break Even', ''],
    },
    { field: 'ret_entry', headerName: 'Ret. Entry', width: 90, type: 'number', editable: true },
    { field: 'sd_exit', headerName: 'SD Exit', width: 90, type: 'number', editable: true },
    { field: 'entry', headerName: 'Entry', width: 90, type: 'number', editable: true },
    { field: 'stop', headerName: 'Stop', width: 90, type: 'number', editable: true },
    { field: 'target', headerName: 'Target', width: 90, type: 'number', editable: true },
    { field: 'exit', headerName: 'Exit', width: 90, type: 'number', editable: true },
    { field: 'stop_ticks', headerName: 'Stop Ticks', width: 100, type: 'number' },
    { field: 'pot_result', headerName: 'Pot. Result', width: 100, type: 'number' },
    { field: 'result', headerName: 'Result', width: 90, type: 'number' },
    { field: 'preparation', headerName: 'Preparation', width: 100, type: 'number', editable: true },
    { field: 'entry_score', headerName: 'Entry', width: 70, type: 'number', editable: true },
    { field: 'stop_loss', headerName: 'Stop Loss', width: 90, type: 'number', editable: true },
    { field: 'target_score', headerName: 'Target', width: 70, type: 'number', editable: true },
    { field: 'management', headerName: 'Management', width: 100, type: 'number', editable: true },
    { field: 'rules', headerName: 'Rules', width: 70, type: 'number', editable: true },
    { field: 'average', headerName: 'Average', width: 90, type: 'number' },
    { 
      field: 'planned_executed', 
      headerName: 'Status', 
      width: 110,
      editable: true,
      type: 'singleSelect',
      valueOptions: ['Planned', 'Executed']
    }
  ];

  // Cell styling based on values
  const getCellClassName = (params) => {
    if (params.field === 'result') {
      if (params.value > 0) return 'positive-result';
      if (params.value < 0) return 'negative-result';
    }
    if (params.field === 'status') {
      if (params.value === 'Winner') return 'winner-status';
      if (params.value === 'Expense') return 'expense-status';
    }
    return '';
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ height: 650, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50, 100, 250, 500]}
        checkboxSelection={false}
        disableRowSelectionOnClick
        getCellClassName={getCellClassName}
        editMode="cell"
        onCellEditStop={params => {
          if (params.reason === 'enterKeyDown' || params.reason === 'tabKeyDown' || params.reason === 'cellFocusOut') {
            handleCellEditCommit(params);
          }
        }}
        sx={{
          '& .positive-result': { color: 'green' },
          '& .negative-result': { color: 'red' },
          '& .winner-status': { color: 'green', fontWeight: 'bold' },
          '& .expense-status': { color: 'red', fontWeight: 'bold' },
        }}
      />
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this trade? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirmed} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Edit Trade
          <IconButton
            aria-label="close"
            onClick={() => setEditDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {currentTrade && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Date"
                  name="date"
                  type="date"
                  value={currentTrade.date}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Confirmation Time"
                  name="confirmation_time"
                  type="time"
                  value={currentTrade.confirmation_time || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }} // 5 min steps
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Entry Time"
                  name="entry_time"
                  type="time"
                  value={currentTrade.entry_time || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }} // 5 min steps
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Instrument</InputLabel>
                  <Select
                    name="instrument_id"
                    value={currentTrade.instrument_id || ''}
                    onChange={handleFormChange}
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
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Confirmation Type</InputLabel>
                  <Select
                    name="confirmation_type"
                    value={currentTrade.confirmation_type || ''}
                    onChange={handleFormChange}
                    label="Confirmation Type"
                  >
                    <MenuItem value="Wick Confirmation">Wick Confirmation</MenuItem>
                    <MenuItem value="Full Confirmation">Full Confirmation</MenuItem>
                    <MenuItem value="Early Indication">Early Indication</MenuItem>
                    <MenuItem value="No Confirmation">No Confirmation</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Direction</InputLabel>
                  <Select
                    name="direction"
                    value={currentTrade.direction || ''}
                    onChange={handleFormChange}
                    label="Direction"
                  >
                    <MenuItem value="Long">Long</MenuItem>
                    <MenuItem value="Short">Short</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Session</InputLabel>
                  <Select
                    name="session"
                    value={currentTrade.session || ''}
                    onChange={handleFormChange}
                    label="Session"
                  >
                    <MenuItem value="ODR">ODR</MenuItem>
                    <MenuItem value="RDR">RDR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Entry Method</InputLabel>
                  <Select
                    name="entry_method_id"
                    value={currentTrade.entry_method_id || ''}
                    onChange={handleFormChange}
                    label="Entry Method"
                  >
                    {entryMethods.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        {method.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Stopped Out</InputLabel>
                  <Select
                    name="stopped_out"
                    value={currentTrade.stopped_out ? 'True' : 'False'}
                    onChange={(e) => handleFormChange({
                      target: {
                        name: 'stopped_out',
                        type: 'checkbox',
                        checked: e.target.value === 'True'
                      }
                    })}
                    label="Stopped Out"
                  >
                    <MenuItem value="True">True</MenuItem>
                    <MenuItem value="False">False</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={currentTrade.status || ''}
                    onChange={handleFormChange}
                    label="Status"
                  >
                    <MenuItem value="Winner">Winner</MenuItem>
                    <MenuItem value="Expense">Expense</MenuItem>
                    <MenuItem value="Break Even">Break Even</MenuItem>
                    <MenuItem value="">None</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Retracement Entry"
                  name="ret_entry"
                  type="number"
                  value={currentTrade.ret_entry || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="SD Exit"
                  name="sd_exit"
                  type="number"
                  value={currentTrade.sd_exit || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  label="Entry"
                  name="entry"
                  type="number"
                  value={currentTrade.entry || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  label="Stop"
                  name="stop"
                  type="number"
                  value={currentTrade.stop || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  label="Target"
                  name="target"
                  type="number"
                  value={currentTrade.target || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  label="Exit"
                  name="exit"
                  type="number"
                  value={currentTrade.exit || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Trade Metrics (Score 1-10)
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  label="Preparation"
                  name="preparation"
                  type="number"
                  value={currentTrade.preparation || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  label="Entry"
                  name="entry_score"
                  type="number"
                  value={currentTrade.entry_score || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  label="Stop Loss"
                  name="stop_loss"
                  type="number"
                  value={currentTrade.stop_loss || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  label="Target"
                  name="target_score"
                  type="number"
                  value={currentTrade.target_score || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  label="Management"
                  name="management"
                  type="number"
                  value={currentTrade.management || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  label="Rules"
                  name="rules"
                  type="number"
                  value={currentTrade.rules || ''}
                  onChange={handleFormChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
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

      {/* Notification snackbar */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TradeTable;