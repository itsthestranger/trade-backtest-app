// src/components/backtest/BacktestTable.jsx
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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  DescriptionOutlined as DocumentIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';

const BacktestTable = ({ trades, onUpdate, onDelete }) => {
  const { instruments, entryMethods, isLoading } = useSettings();

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [rowIdToDelete, setRowIdToDelete] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTrade, setCurrentTrade] = useState(null);
  const [documentationOpen, setDocumentationOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Handle edit
  const handleEdit = (trade) => {
    setCurrentTrade(trade);
    setEditDialogOpen(true);
  };

  // Handle view documentation
  const handleViewDocumentation = (trade) => {
    setCurrentTrade(trade);
    setDocumentationOpen(true);
  };

  // Handle duplicate trade
  const handleDuplicate = async (trade) => {
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

    try {
      await onUpdate(id, newTrade);
      setSnackbarMessage('Trade duplicated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error duplicating trade:', error);
      setSnackbarMessage('Error duplicating trade');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
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

  // Handle form changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    
    // Special case for switch controls
    const newValue = event.target.type === 'checkbox' ? event.target.checked : value;
    
    setCurrentTrade({
      ...currentTrade,
      [name]: newValue
    });
  };

  // Handle cell edit
  const handleCellEditCommit = async (params) => {
    try {
      const { id, field, value } = params;
      
      // Find the original trade
      const trade = trades.find(t => t.id === id);
      if (!trade) return;
      
      // Create an update object with just the changed field
      const updateData = { [field]: value };
      
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

  // Handle save
  const handleSave = async () => {
    try {
      // Get entry, stop, target values
      const entry = parseFloat(currentTrade.entry);
      const stop = parseFloat(currentTrade.stop);
      const target = parseFloat(currentTrade.target);
      
      // Calculate derived values
      const stopTicks = Math.abs(entry - stop);
      const potResult = Math.abs(target - entry) / Math.abs(entry - stop);
      
      let result = null;
      if (currentTrade.exit) {
        result = (currentTrade.exit - entry) / Math.abs(entry - stop);
      }
      
      // Calculate average score
      const average = (
        parseFloat(currentTrade.preparation || 0) +
        parseFloat(currentTrade.entry_score || 0) +
        parseFloat(currentTrade.stop_loss || 0) +
        parseFloat(currentTrade.target_score || 0) +
        parseFloat(currentTrade.management || 0) +
        parseFloat(currentTrade.rules || 0)
      ) / 6;
      
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
      setSnackbarMessage('Error updating trade');
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
    stopped_out: trade.stopped_out ? 'Yes' : 'No',
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
    // Reference to the original trade object
    raw: trade,
  }));

  // Define columns - put actions first
  const columns = [
    actionsColumn,
    { field: 'day', headerName: 'Day', width: 60 },
    { field: 'date', headerName: 'Date', width: 110, editable: true, type: 'date' },
    { field: 'confirmation_time', headerName: 'Conf Time', width: 90, editable: true },
    { field: 'entry_time', headerName: 'Entry Time', width: 90, editable: true },
    { field: 'instrument', headerName: 'Instrument', width: 100 },
    { field: 'confirmation_type', headerName: 'Conf Type', width: 120 },
    { field: 'direction', headerName: 'Direction', width: 80 },
    { field: 'session', headerName: 'Session', width: 80 },
    { field: 'entry_method', headerName: 'Entry Method', width: 150 },
    { field: 'stopped_out', headerName: 'Stopped Out', width: 100 },
    { field: 'status', headerName: 'Status', width: 80 },
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
    { field: 'average', headerName: 'Average', width: 90, type: 'number' }
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
        processRowUpdate={(newRow, oldRow) => newRow}
        onCellEditStop={handleCellEditCommit}
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
      
      {/* Edit Trade Dialog */}
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
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentTrade.stopped_out || false}
                      onChange={handleFormChange}
                      name="stopped_out"
                    />
                  }
                  label="Stopped Out"
                />
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
      
      {/* Documentation Dialog */}
      <Dialog
        open={documentationOpen}
        onClose={() => setDocumentationOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Trade Documentation
          <IconButton
            aria-label="close"
            onClick={() => setDocumentationOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {currentTrade && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {currentTrade.instrument_name} {currentTrade.direction} ({currentTrade.date})
              </Typography>
              
              {currentTrade.documentation && currentTrade.documentation.trade_journal && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Trade Journal:</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {currentTrade.documentation.trade_journal}
                  </Typography>
                </Box>
              )}
              
              {currentTrade.confluences && currentTrade.confluences.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Confluences:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {currentTrade.confluences.map((confluence) => (
                      <Tooltip key={confluence.id} title={confluence.name}>
                        <Box 
                          component="span" 
                          sx={{ 
                            p: 0.5, 
                            bgcolor: 'primary.light', 
                            color: 'primary.contrastText',
                            borderRadius: 1,
                            fontSize: '0.8rem'
                          }}
                        >
                          {confluence.name}
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              )}
              
              {currentTrade.documentation && currentTrade.documentation.body_mind_state && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Body & Mind State:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {currentTrade.documentation.body_mind_state.split(',').map((state) => (
                      <Tooltip key={state} title={state}>
                        <Box 
                          component="span" 
                          sx={{ 
                            p: 0.5, 
                            bgcolor: 'secondary.light', 
                            color: 'secondary.contrastText',
                            borderRadius: 1,
                            fontSize: '0.8rem'
                          }}
                        >
                          {state}
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentationOpen(false)}>Close</Button>
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

export default BacktestTable;