// src/components/playbooks/PlaybookVisual.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  AccessTime as TimeIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

const PlaybookVisual = ({ playbook, instrument }) => {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [filteredEntry, setFilteredEntry] = useState(null);
  
  // Get unique days from playbook entries
  const days = [...new Set(playbook.entries.map(entry => entry.day))].sort((a, b) => {
    const dayOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5 };
    return dayOrder[a] - dayOrder[b];
  });
  
  // Get directions for selected day
  const getDirections = () => {
    if (!selectedDay) return [];
    
    return [...new Set(
      playbook.entries
        .filter(entry => entry.day === selectedDay)
        .map(entry => entry.direction)
    )];
  };
  
  // Get confirmation times for selected day and direction
  const getConfirmationTimes = () => {
    if (!selectedDay || !selectedDirection) return [];
    
    return [...new Set(
      playbook.entries
        .filter(entry => entry.day === selectedDay && entry.direction === selectedDirection)
        .map(entry => entry.confirmation_time)
    )].sort();
  };
  
  // Handle selection changes
  const handleDayChange = (event) => {
    setSelectedDay(event.target.value);
    setSelectedDirection('');
    setSelectedTime('');
  };
  
  const handleDirectionChange = (event) => {
    setSelectedDirection(event.target.value);
    setSelectedTime('');
  };
  
  const handleTimeChange = (event) => {
    setSelectedTime(event.target.value);
  };
  
  // Update filtered entry when selections change
  useEffect(() => {
    if (selectedDay && selectedDirection && selectedTime) {
      const entry = playbook.entries.find(
        entry => entry.day === selectedDay && 
                entry.direction === selectedDirection && 
                entry.confirmation_time === selectedTime
      );
      
      setFilteredEntry(entry);
    } else {
      setFilteredEntry(null);
    }
  }, [selectedDay, selectedDirection, selectedTime, playbook.entries]);
  
  // Function to format time values for display
  const formatTimeRange = (start, end) => {
    if (!start && !end) return 'N/A';
    if (start && !end) return start;
    if (!start && end) return `until ${end}`;
    return `${start} - ${end}`;
  };
  
  // Function to format cluster values for display
  const formatClusterRange = (start, end) => {
    if (start === undefined || end === undefined) return 'N/A';
    return `${start} - ${end}`;
  };
  
  // If no entries, show message
  if (playbook.entries.length === 0) {
    return (
      <Alert severity="info">
        No entries in this playbook yet. Add entries in the Table view.
      </Alert>
    );
  }
  
  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Day</InputLabel>
            <Select
              value={selectedDay}
              onChange={handleDayChange}
              label="Day"
            >
              {days.map((day) => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth disabled={!selectedDay}>
            <InputLabel>Direction</InputLabel>
            <Select
              value={selectedDirection}
              onChange={handleDirectionChange}
              label="Direction"
            >
              {getDirections().map((direction) => (
                <MenuItem key={direction} value={direction}>
                  {direction === 'Long' ? (
                    <>
                      <ArrowUpIcon sx={{ color: 'success.main', mr: 1 }} /> Long
                    </>
                  ) : (
                    <>
                      <ArrowDownIcon sx={{ color: 'error.main', mr: 1 }} /> Short
                    </>
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth disabled={!selectedDay || !selectedDirection}>
            <InputLabel>Confirmation Time</InputLabel>
            <Select
              value={selectedTime}
              onChange={handleTimeChange}
              label="Confirmation Time"
            >
              {getConfirmationTimes().map((time) => (
                <MenuItem key={time} value={time}>{time}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {!filteredEntry && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Select day, direction and confirmation time to view playbook details
          </Typography>
        </Paper>
      )}
      
      {filteredEntry && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                {instrument?.name} {filteredEntry.direction} {filteredEntry.day} {filteredEntry.confirmation_time}
              </Typography>
              {filteredEntry.direction === 'Long' ? (
                <ArrowUpIcon sx={{ color: 'success.main', fontSize: 30 }} />
              ) : (
                <ArrowDownIcon sx={{ color: 'error.main', fontSize: 30 }} />
              )}
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              {/* Time Information */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimeIcon sx={{ mr: 1 }} /> Time Information
                  </Typography>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row">Confirmation Time</TableCell>
                          <TableCell>{filteredEntry.confirmation_time}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Mode Time</TableCell>
                          <TableCell>{formatTimeRange(filteredEntry.mode_time_start, filteredEntry.mode_time_end)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Time Cluster 1</TableCell>
                          <TableCell>{formatTimeRange(filteredEntry.time_cl_1_start, filteredEntry.time_cl_1_end)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Retracement Median Time</TableCell>
                          <TableCell>{filteredEntry.ret_median_time || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Dropoff Time</TableCell>
                          <TableCell>{filteredEntry.dropoff_time || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Extension Median Time</TableCell>
                          <TableCell>{filteredEntry.ext_median_time || 'N/A'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
              
              {/* Retracement Clusters */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimelineIcon sx={{ mr: 1 }} /> Retracement & Extension Values
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Retracement Clusters
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" scope="row">Cluster 1</TableCell>
                            <TableCell>
                              {formatClusterRange(filteredEntry.ret_cluster_1_start, filteredEntry.ret_cluster_1_end)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Cluster 2</TableCell>
                            <TableCell>
                              {formatClusterRange(filteredEntry.ret_cluster_2_start, filteredEntry.ret_cluster_2_end)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Cluster 3</TableCell>
                            <TableCell>
                              {formatClusterRange(filteredEntry.ret_cluster_3_start, filteredEntry.ret_cluster_3_end)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Extension Clusters
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" scope="row">Cluster 1</TableCell>
                            <TableCell>
                              {formatClusterRange(filteredEntry.ext_cluster_1_start, filteredEntry.ext_cluster_1_end)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Cluster 2</TableCell>
                            <TableCell>
                              {formatClusterRange(filteredEntry.ext_cluster_2_start, filteredEntry.ext_cluster_2_end)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Timeline Visualization */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Timeline Visualization
                  </Typography>
                  
                  <Box sx={{ position: 'relative', height: 100, mx: 2 }}>
                    {/* Timeline base */}
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: 0, 
                        right: 0, 
                        height: 2, 
                        bgcolor: 'divider' 
                      }} 
                    />
                    
                    {/* Mark confirmation time */}
                    {filteredEntry.confirmation_time && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '25%',
                          left: '10%',
                          width: 2,
                          height: '50%',
                          bgcolor: 'primary.main',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: '100%',
                            left: -4,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'primary.main'
                          }
                        }}
                      >
                        <Typography variant="caption" sx={{ position: 'absolute', bottom: -25, left: -40, width: 80, textAlign: 'center' }}>
                          Conf. Time<br />{filteredEntry.confirmation_time}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Mark retracement median time */}
                    {filteredEntry.ret_median_time && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '25%',
                          left: '30%',
                          width: 2,
                          height: '50%',
                          bgcolor: 'secondary.main',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: '100%',
                            left: -4,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'secondary.main'
                          }
                        }}
                      >
                        <Typography variant="caption" sx={{ position: 'absolute', bottom: -25, left: -40, width: 80, textAlign: 'center' }}>
                          Ret. Time<br />{filteredEntry.ret_median_time}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Mark dropoff time */}
                    {filteredEntry.dropoff_time && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '25%',
                          left: '50%',
                          width: 2,
                          height: '50%',
                          bgcolor: 'warning.main',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: '100%',
                            left: -4,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'warning.main'
                          }
                        }}
                      >
                        <Typography variant="caption" sx={{ position: 'absolute', bottom: -25, left: -40, width: 80, textAlign: 'center' }}>
                          Dropoff<br />{filteredEntry.dropoff_time}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Mark extension median time */}
                    {filteredEntry.ext_median_time && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '25%',
                          left: '70%',
                          width: 2,
                          height: '50%',
                          bgcolor: 'success.main',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: '100%',
                            left: -4,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'success.main'
                          }
                        }}
                      >
                        <Typography variant="caption" sx={{ position: 'absolute', bottom: -25, left: -40, width: 80, textAlign: 'center' }}>
                          Ext. Time<br />{filteredEntry.ext_median_time}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PlaybookVisual;