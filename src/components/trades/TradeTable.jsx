// src/components/trades/TradeTable.jsx
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
  Alert
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  DescriptionOutlined as DocumentIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const TradeTable = ({ trades, onSelect, onUpdate, onDelete }) => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [rowIdToDelete, setRowIdToDelete] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Handle view documentation
  const handleViewDocumentation = (trade) => {
    onSelect(trade);
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
      
      // Create an update object with just the changed field
      const updateData = { [field]: formattedValue };
      
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
        onClick={() => onSelect(params.row.raw)}
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
    confirmation_type: trade.confirmation_type,
    direction: trade.direction,
    session: trade.session,
    entry_method: trade.entry_method_name,
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
    planned_executed: trade.planned_executed,
    // Reference to the original trade object
    raw: trade,
  }));

  // Define columns - put actions first
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
    { field: 'average', headerName: 'Average', width: 90, type: 'number' },
    { field: 'planned_executed', headerName: 'Status', width: 90 }
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