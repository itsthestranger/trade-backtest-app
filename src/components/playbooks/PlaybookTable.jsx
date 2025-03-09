// src/components/playbooks/PlaybookTable.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const PlaybookTable = ({ playbook, onUpdate }) => {
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Initial load of entries
  useEffect(() => {
    if (playbook && playbook.entries) {
      setEntries(playbook.entries);
    } else {
      setEntries([]);
    }
  }, [playbook]);
  
  // Handle add new entry
  const handleAddEntry = () => {
    // Create empty entry
    const newEntry = {
      id: Date.now(), // Temporary ID for UI purposes
      day: '',
      direction: '',
      confirmation_time: '',
      mode_time_start: '',
      mode_time_end: '',
      time_cl_1_start: '',
      time_cl_1_end: '',
      ret_median_time: '',
      dropoff_time: '',
      ret_cluster_1_start: 0,
      ret_cluster_1_end: 0,
      ret_cluster_2_start: 0,
      ret_cluster_2_end: 0,
      ret_cluster_3_start: 0,
      ret_cluster_3_end: 0,
      ext_median_time: '',
      ext_cluster_1_start: 0,
      ext_cluster_1_end: 0,
      ext_cluster_2_start: 0,
      ext_cluster_2_end: 0
    };
    
    setEditingEntry(newEntry);
    setEditDialogOpen(true);
  };
  
  // Handle edit entry
  const handleEditEntry = (entry) => {
    setEditingEntry({ ...entry });
    setEditDialogOpen(true);
  };
  
  // Handle delete entry
  const handleDeleteEntry = (entryId) => {
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    setEntries(updatedEntries);
    onUpdate(updatedEntries);
  };
  
  // Handle save entry
  const handleSaveEntry = () => {
    if (!editingEntry) return;
    
    let updatedEntries;
    const existingIndex = entries.findIndex(e => e.id === editingEntry.id);
    
    if (existingIndex >= 0) {
      // Update existing entry
      updatedEntries = [
        ...entries.slice(0, existingIndex),
        editingEntry,
        ...entries.slice(existingIndex + 1)
      ];
    } else {
      // Add new entry
      updatedEntries = [...entries, editingEntry];
    }
    
    setEntries(updatedEntries);
    onUpdate(updatedEntries);
    setEditDialogOpen(false);
    setEditingEntry(null);
  };
  
  // Handle form changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditingEntry({
      ...editingEntry,
      [name]: value
    });
  };
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddEntry}
        >
          Add Entry
        </Button>
      </Box>
      
      {entries.length === 0 ? (
        <Alert severity="info">
          No entries in this playbook yet. Click "Add Entry" to create your first entry.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Confirmation Time</TableCell>
                <TableCell>Mode Time</TableCell>
                <TableCell>Time Cluster 1</TableCell>
                <TableCell>Ret. Median Time</TableCell>
                <TableCell>Dropoff Time</TableCell>
                <TableCell>Ret. Clusters</TableCell>
                <TableCell>Ext. Median Time</TableCell>
                <TableCell>Ext. Clusters</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.day}</TableCell>
                  <TableCell>{entry.direction}</TableCell>
                  <TableCell>{entry.confirmation_time}</TableCell>
                  <TableCell>
                    {entry.mode_time_start} - {entry.mode_time_end}
                  </TableCell>
                  <TableCell>
                    {entry.time_cl_1_start} - {entry.time_cl_1_end}
                  </TableCell>
                  <TableCell>{entry.ret_median_time}</TableCell>
                  <TableCell>{entry.dropoff_time}</TableCell>
                  <TableCell>
                    {entry.ret_cluster_1_start} - {entry.ret_cluster_1_end}<br />
                    {entry.ret_cluster_2_start} - {entry.ret_cluster_2_end}<br />
                    {entry.ret_cluster_3_start} - {entry.ret_cluster_3_end}
                  </TableCell>
                  <TableCell>{entry.ext_median_time}</TableCell>
                  <TableCell>
                    {entry.ext_cluster_1_start} - {entry.ext_cluster_1_end}<br />
                    {entry.ext_cluster_2_start} - {entry.ext_cluster_2_end}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEditEntry(entry)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteEntry(entry.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingEntry?.id ? 'Edit Entry' : 'Add Entry'}
        </DialogTitle>
        <DialogContent>
          {editingEntry && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Day</InputLabel>
                  <Select
                    name="day"
                    value={editingEntry.day}
                    onChange={handleChange}
                    label="Day"
                  >
                    <MenuItem value="Mon">Monday</MenuItem>
                    <MenuItem value="Tue">Tuesday</MenuItem>
                    <MenuItem value="Wed">Wednesday</MenuItem>
                    <MenuItem value="Thu">Thursday</MenuItem>
                    <MenuItem value="Fri">Friday</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Direction</InputLabel>
                  <Select
                    name="direction"
                    value={editingEntry.direction}
                    onChange={handleChange}
                    label="Direction"
                  >
                    <MenuItem value="Long">Long</MenuItem>
                    <MenuItem value="Short">Short</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Confirmation Time"
                  name="confirmation_time"
                  type="time"
                  value={editingEntry.confirmation_time}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }} // 5 min steps
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Time Ranges
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Mode Time Start"
                      name="mode_time_start"
                      type="time"
                      value={editingEntry.mode_time_start}
                      onChange={handleChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Mode Time End"
                      name="mode_time_end"
                      type="time"
                      value={editingEntry.mode_time_end}
                      onChange={handleChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Time Cluster 1 Start"
                      name="time_cl_1_start"
                      type="time"
                      value={editingEntry.time_cl_1_start}
                      onChange={handleChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Time Cluster 1 End"
                      name="time_cl_1_end"
                      type="time"
                      value={editingEntry.time_cl_1_end}
                      onChange={handleChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Ret. Median Time"
                  name="ret_median_time"
                  type="time"
                  value={editingEntry.ret_median_time}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Dropoff Time"
                  name="dropoff_time"
                  type="time"
                  value={editingEntry.dropoff_time}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Retracement Clusters
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Ret. Cluster 1 Start"
                      name="ret_cluster_1_start"
                      type="number"
                      value={editingEntry.ret_cluster_1_start}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ step: 0.1, min: -1.5, max: 3.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Ret. Cluster 1 End"
                      name="ret_cluster_1_end"
                      type="number"
                      value={editingEntry.ret_cluster_1_end}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ step: 0.1, min: -1.5, max: 3.5 }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Ret. Cluster 2 Start"
                      name="ret_cluster_2_start"
                      type="number"
                      value={editingEntry.ret_cluster_2_start}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ step: 0.1, min: -1.5, max: 3.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Ret. Cluster 2 End"
                      name="ret_cluster_2_end"
                      type="number"
                      value={editingEntry.ret_cluster_2_end}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ step: 0.1, min: -1.5, max: 3.5 }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Ret. Cluster 3 Start"
                      name="ret_cluster_3_start"
                      type="number"
                      value={editingEntry.ret_cluster_3_start}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ step: 0.1, min: -1.5, max: 3.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Ret. Cluster 3 End"
                      name="ret_cluster_3_end"
                      type="number"
                      value={editingEntry.ret_cluster_3_end}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ step: 0.1, min: -1.5, max: 3.5 }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Extension Clusters
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Ext. Median Time"
                  name="ext_median_time"
                  type="time"
                  value={editingEntry.ext_median_time}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Ext. Cluster 1 Start"
                      name="ext_cluster_1_start"
                      type="number"
                      value={editingEntry.ext_cluster_1_start}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ step: 0.1, min: -1.5, max: 3.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Ext. Cluster 1 End"
                      name="ext_cluster_1_end"
                      type="number"
                      value={editingEntry.ext_cluster_1_end}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ step: 0.1, min: -1.5, max: 3.5 }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Ext. Cluster 2 Start"
                      name="ext_cluster_2_start"
                      type="number"
                      value={editingEntry.ext_cluster_2_start}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ step: 0.1, min: -1.5, max: 3.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Ext. Cluster 2 End"
                      name="ext_cluster_2_end"
                      type="number"
                      value={editingEntry.ext_cluster_2_end}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ step: 0.1, min: -1.5, max: 3.5 }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveEntry}
            color="primary"
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlaybookTable;