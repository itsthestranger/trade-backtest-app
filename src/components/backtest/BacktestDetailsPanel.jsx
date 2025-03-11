import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon
} from '@mui/icons-material';
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

const BacktestDetailsPanel = ({ backtest, onUpdate }) => {
  const { confluences } = useSettings();
  
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [formState, setFormState] = useState({
    name: backtest?.name || '',
    info: backtest?.info || '',
    confluences: backtest?.confluences?.map(c => c.id) || []
  });
  
  // Update form state when backtest changes
  React.useEffect(() => {
    if (backtest) {
      setFormState({
        name: backtest.name || '',
        info: backtest.info || '',
        confluences: backtest.confluences?.map(c => c.id) || []
      });
    }
  }, [backtest]);
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value
    });
  };
  
  const handleConfluencesChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormState({
      ...formState,
      confluences: typeof value === 'string' ? value.split(',') : value
    });
  };
  
  const handleStartEdit = () => {
    setEditing(true);
  };
  
  const handleCancelEdit = () => {
    setEditing(false);
    // Reset form state to backtest values
    setFormState({
      name: backtest?.name || '',
      info: backtest?.info || '',
      confluences: backtest?.confluences?.map(c => c.id) || []
    });
  };
  
  const handleSave = async () => {
    try {
      await onUpdate(backtest.id, {
        name: formState.name,
        info: formState.info,
        confluences: formState.confluences
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating backtest:', error);
    }
  };
  
  if (!backtest) return null;
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">
          Backtest Details
        </Typography>
        <Box>
          <IconButton onClick={handleToggleExpand} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          {!editing ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleStartEdit}
              size="small"
              sx={{ ml: 1 }}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancelEdit}
                size="small"
                sx={{ ml: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                size="small"
                sx={{ ml: 1 }}
              >
                Save
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      <Collapse in={expanded} timeout="auto">
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {editing ? (
              <TextField
                label="Backtest Name"
                name="name"
                value={formState.name}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
              />
            ) : (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">
                  {backtest.name}
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12}>
            {editing ? (
              <TextField
                label="Info"
                name="info"
                value={formState.info}
                onChange={handleChange}
                fullWidth
                margin="normal"
                multiline
                rows={4}
              />
            ) : (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Info
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {backtest.info || 'No information provided.'}
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12}>
            {editing ? (
              <FormControl fullWidth margin="normal">
                <InputLabel id="confluences-label">Confluences</InputLabel>
                <Select
                  labelId="confluences-label"
                  id="confluences"
                  multiple
                  value={formState.confluences}
                  onChange={handleConfluencesChange}
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
            ) : (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Confluences
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {backtest.confluences && backtest.confluences.length > 0 ? (
                    backtest.confluences.map((confluence) => (
                      <Chip key={confluence.id} label={confluence.name} size="small" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No confluences selected.
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default BacktestDetailsPanel;