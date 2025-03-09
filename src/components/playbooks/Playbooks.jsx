// src/components/playbooks/Playbooks.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useSettings } from '../../contexts/SettingsContext';
import PlaybookTable from './PlaybookTable';
import PlaybookVisual from './PlaybookVisual';

const Playbooks = () => {
  const { db, isLoading: dbLoading } = useDatabase();
  const { instruments, isLoading: settingsLoading } = useSettings();
  
  const [playbooks, setPlaybooks] = useState([]);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaybookName, setNewPlaybookName] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'visual'
  
  // Load playbooks
  useEffect(() => {
    const loadPlaybooks = async () => {
      if (dbLoading || settingsLoading) return;
      
      try {
        setIsLoading(true);
        
        // Load playbooks
        const playbooksData = await db.getPlaybooks();
        setPlaybooks(playbooksData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading playbooks:', error);
        setError('Failed to load playbooks. Please try again.');
        setIsLoading(false);
      }
    };
    
    loadPlaybooks();
  }, [db, dbLoading, settingsLoading]);
  
  // Handle instrument selection
  const handleInstrumentSelect = async (instrument) => {
    setSelectedInstrument(instrument);
    
    try {
      // Check if a playbook exists for this instrument
      const instrumentPlaybooks = playbooks.filter(p => p.instrument_id === instrument.id);
      
      if (instrumentPlaybooks.length > 0) {
        // Load playbook details
        const playbook = await db.getPlaybook(instrumentPlaybooks[0].id);
        setSelectedPlaybook(playbook);
      } else {
        setSelectedPlaybook(null);
        // Prompt to create a playbook
        setCreateDialogOpen(true);
      }
    } catch (error) {
      console.error('Error selecting instrument:', error);
      setError('Failed to load playbook data. Please try again.');
    }
  };
  
  // Handle create playbook
  const handleCreatePlaybook = async () => {
    if (!selectedInstrument || !newPlaybookName.trim()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create new playbook
      const newPlaybook = await db.createPlaybook({
        name: newPlaybookName.trim(),
        instrument_id: selectedInstrument.id
      });
      
      // Add to playbooks list
      setPlaybooks([...playbooks, newPlaybook]);
      
      // Select the new playbook
      const playbook = await db.getPlaybook(newPlaybook.id);
      setSelectedPlaybook(playbook);
      
      // Close dialog and reset form
      setCreateDialogOpen(false);
      setNewPlaybookName('');
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating playbook:', error);
      setError('Failed to create playbook. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle update playbook entries
  const handleUpdateEntries = async (entries) => {
    if (!selectedPlaybook) return;
    
    try {
      setIsLoading(true);
      
      // Update playbook with new entries
      const updatedPlaybook = await db.updatePlaybook(selectedPlaybook.id, {
        entries
      });
      
      // Update selected playbook
      setSelectedPlaybook(updatedPlaybook);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating playbook entries:', error);
      setError('Failed to update playbook. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Show loading state
  if ((isLoading && dbLoading) || settingsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4">Playbooks</Typography>
            {selectedPlaybook && (
              <Box>
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  startIcon={<ViewListIcon />}
                  onClick={() => setViewMode('table')}
                  sx={{ mr: 1 }}
                >
                  Table View
                </Button>
                <Button
                  variant={viewMode === 'visual' ? 'contained' : 'outlined'}
                  startIcon={<ViewModuleIcon />}
                  onClick={() => setViewMode('visual')}
                >
                  Visual View
                </Button>
              </Box>
            )}
          </Box>
        </Grid>
        
        {/* Instrument selection */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ height: '100%', p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Instrument
            </Typography>
            <List dense>
              {instruments.map((instrument) => (
                <ListItem 
                  key={instrument.id}
                  disablePadding
                  selected={selectedInstrument && selectedInstrument.id === instrument.id}
                >
                  <ListItemText
                    primary={
                      <Box 
                        component="span" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 1,
                          cursor: 'pointer',
                          bgcolor: selectedInstrument && selectedInstrument.id === instrument.id ? 
                            'primary.light' : 'background.paper',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                        onClick={() => handleInstrumentSelect(instrument)}
                      >
                        <Box 
                          component="span" 
                          sx={{ 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            bgcolor: instrument.color,
                            mr: 1
                          }} 
                        />
                        {instrument.name}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              
              {instruments.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No instruments defined yet. Add instruments in the Settings section.
                </Alert>
              )}
            </List>
          </Paper>
        </Grid>
        
        {/* Playbook content */}
        <Grid item xs={12} md={9}>
          {selectedInstrument && !selectedPlaybook && !isLoading && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No playbook for {selectedInstrument.name}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Create Playbook
              </Button>
            </Paper>
          )}
          
          {selectedPlaybook && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedPlaybook.name} ({selectedInstrument?.name})
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              {viewMode === 'table' ? (
                <PlaybookTable 
                  playbook={selectedPlaybook}
                  onUpdate={handleUpdateEntries}
                />
              ) : (
                <PlaybookVisual 
                  playbook={selectedPlaybook}
                  instrument={selectedInstrument}
                />
              )}
            </Paper>
          )}
          
          {!selectedInstrument && !isLoading && (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Select an instrument to view or create its playbook
              </Typography>
            </Paper>
          )}
          
          {isLoading && !dbLoading && !settingsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </Grid>
      </Grid>
      
      {/* Create Playbook Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create Playbook for {selectedInstrument?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Playbook Name"
            fullWidth
            value={newPlaybookName}
            onChange={(e) => setNewPlaybookName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePlaybook} color="primary" disabled={!newPlaybookName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Playbooks;