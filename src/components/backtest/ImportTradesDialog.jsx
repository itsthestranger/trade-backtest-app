// src/components/backtest/ImportTradesDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Grid,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Close as CloseIcon } from '@mui/icons-material';
import Papa from 'papaparse';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useSettings } from '../../contexts/SettingsContext';

const ImportTradesDialog = ({ open, onClose, backtestId, onImportComplete }) => {
  const { db } = useDatabase();
  const { instruments, entryMethods } = useSettings();
  
  const [activeStep, setActiveStep] = useState(0);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [mappingErrors, setMappingErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Expected trade fields (based on the database schema)
  const tradeFields = [
    { name: 'date', label: 'Date', required: true },
    { name: 'day', label: 'Day', required: false }, // Can be calculated from date
    { name: 'confirmation_time', label: 'Confirmation Time', required: true },
    { name: 'entry_time', label: 'Entry Time', required: true },
    { name: 'instrument', label: 'Instrument', required: true }, // Will map to instrument_id
    { name: 'confirmation_type', label: 'Confirmation Type', required: true },
    { name: 'direction', label: 'Direction', required: true },
    { name: 'session', label: 'Session', required: true },
    { name: 'entry_method', label: 'Entry Method', required: true }, // Will map to entry_method_id
    { name: 'stopped_out', label: 'Stopped Out', required: false },
    { name: 'status', label: 'Status', required: false },
    { name: 'ret_entry', label: 'Ret Entry', required: false },
    { name: 'sd_exit', label: 'SD Exit', required: false },
    { name: 'entry', label: 'Entry', required: true },
    { name: 'stop', label: 'Stop', required: true },
    { name: 'target', label: 'Target', required: true },
    { name: 'exit', label: 'Exit', required: false },
    { name: 'preparation', label: 'Preparation', required: false },
    { name: 'entry_score', label: 'Entry Score', required: false },
    { name: 'stop_loss', label: 'Stop Loss', required: false },
    { name: 'target_score', label: 'Target Score', required: false },
    { name: 'management', label: 'Management', required: false },
    { name: 'rules', label: 'Rules', required: false },
    { name: 'planned_executed', label: 'Planned/Executed', required: false },
  ];
  
  // Steps for the import process
  const steps = ['Upload CSV', 'Map Columns', 'Import Data'];
  
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setCsvFile(null);
      setParsedData(null);
      setColumnMapping({});
      setMappingErrors({});
      setIsProcessing(false);
      setImportResult(null);
      setError(null);
    }
  }, [open]);
  
  // Reset column mapping when parsed data changes
  useEffect(() => {
    if (parsedData) {
      const initialMapping = {};
      const csvHeaders = parsedData.meta.fields || [];
      
      // Try to auto-map CSV columns to trade fields based on name
      csvHeaders.forEach(header => {
        // Look for an exact match or a case-insensitive match
        const matchedField = tradeFields.find(
          field => field.name === header || 
          field.name.toLowerCase() === header.toLowerCase() ||
          field.label.toLowerCase() === header.toLowerCase()
        );
        
        if (matchedField) {
          initialMapping[matchedField.name] = header;
        }
      });
      
      setColumnMapping(initialMapping);
    }
  }, [parsedData]);
  
  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCsvFile(file);
      
      // Use standard FileReader API instead of window.fs
      try {
        setIsProcessing(true);
        setError(null);
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const fileContent = e.target.result;
          
          // Parse the CSV content
          Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
              setParsedData(results);
              setIsProcessing(false);
            },
            error: (error) => {
              console.error('Error parsing CSV:', error);
              setError(`Error parsing CSV: ${error.message}`);
              setIsProcessing(false);
            }
          });
        };
        
        reader.onerror = (e) => {
          console.error('Error reading file:', e);
          setError(`Error reading file: ${e.target.error.message}`);
          setIsProcessing(false);
        };
        
        reader.readAsText(file);
      } catch (error) {
        console.error('Error handling file:', error);
        setError(`Error handling file: ${error.message}`);
        setIsProcessing(false);
      }
    }
  };
  
  // Handle column mapping change
  const handleMappingChange = (fieldName, csvColumn) => {
    setColumnMapping(prev => ({
      ...prev,
      [fieldName]: csvColumn
    }));
    
    // Clear error for this field
    if (mappingErrors[fieldName]) {
      setMappingErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };
  
  // Validate column mapping
  const validateMapping = () => {
    const errors = {};
    let isValid = true;
    
    // Check if all required fields are mapped
    tradeFields.forEach(field => {
      if (field.required && !columnMapping[field.name]) {
        errors[field.name] = `${field.label} is required`;
        isValid = false;
      }
    });
    
    setMappingErrors(errors);
    return isValid;
  };
  
  // Handle next step
  const handleNext = () => {
    if (activeStep === 0) {
      // Validate CSV file
      if (!csvFile) {
        setError('Please select a CSV file');
        return;
      }
      
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Validate column mapping
      if (!validateMapping()) {
        return;
      }
      
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Start import process
      handleImport();
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Calculate day from date
  const calculateDay = (dateStr) => {
    if (!dateStr) return 'Mon'; // Default to Monday if no date
    try {
      // Try to parse the date, handling various formats
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date: ${dateStr}, defaulting to 'Mon'`);
        return 'Mon';
      }
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()];
    } catch (e) {
      console.warn(`Error calculating day from date ${dateStr}:`, e);
      return 'Mon'; // Default to Monday on error
    }
  };
  
  // Handle import
  const handleImport = async () => {
    if (!parsedData || !backtestId) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log(`Starting import for ${parsedData.data.length} rows`);
      
      const importData = parsedData.data.map(row => {
        const tradeData = {
          backtest_id: backtestId,
        };
        
        // Map CSV columns to trade fields
        Object.entries(columnMapping).forEach(([fieldName, csvColumn]) => {
          if (csvColumn) {
            // Get value from CSV row
            let value = row[csvColumn];
            
            // Handle specific fields
            if (fieldName === 'instrument') {
              // Map instrument name to ID
              const instrument = instruments.find(i => 
                i.name.toLowerCase() === String(value).toLowerCase()
              );
              if (instrument) {
                tradeData.instrument_id = instrument.id;
              } else {
                // If no match, use the first instrument (better than failing)
                tradeData.instrument_id = instruments[0]?.id;
              }
            } else if (fieldName === 'entry_method') {
              // Map entry method name to ID
              const entryMethod = entryMethods.find(m => 
                m.name.toLowerCase() === String(value).toLowerCase()
              );
              if (entryMethod) {
                tradeData.entry_method_id = entryMethod.id;
              } else {
                // If no match, use the first entry method
                tradeData.entry_method_id = entryMethods[0]?.id;
              }
            } else if (fieldName === 'stopped_out') {
              // Convert to boolean
              tradeData.stopped_out = ['yes', 'true', '1', 'y'].includes(String(value).toLowerCase());
            } else if (['entry', 'stop', 'target', 'exit', 'ret_entry', 'sd_exit', 'preparation', 
                        'entry_score', 'stop_loss', 'target_score', 'management', 'rules'].includes(fieldName)) {
              // Convert to number
              tradeData[fieldName] = value !== null && value !== undefined ? parseFloat(value) : null;
            } else {
              // Use value as is for other fields
              tradeData[fieldName] = value;
            }
          }
        });
        
        // Calculate day if not provided
        if (!tradeData.day && tradeData.date) {
          tradeData.day = calculateDay(tradeData.date);
        }
        
        // Ensure planned_executed has a default value
        if (!tradeData.planned_executed) {
          tradeData.planned_executed = 'Planned';
        }
        
        return tradeData;
      });
      
      // Filter out rows with empty or undefined required fields
      const validImportData = importData.filter(trade => 
        trade.date && trade.confirmation_time && trade.instrument_id && 
        trade.entry_method_id && trade.entry && trade.stop && trade.target
      );
      
      console.log(`Found ${validImportData.length} valid trades to import`);
      
      if (validImportData.length === 0) {
        throw new Error('No valid trades found in CSV');
      }
      
      // Import trades
      let successful = 0;
      let failed = 0;
      const errors = [];
      
      // Process each trade with Promise.all for better performance
      const importPromises = validImportData.map(async (tradeData, index) => {
        try {
          console.log(`Importing trade ${index + 1}/${validImportData.length}`);
          // Create a new object for each trade to avoid reference issues
          const cleanTradeData = JSON.parse(JSON.stringify(tradeData));
          
          // Add timestamp to confirmation_time and entry_time if missing
          if (cleanTradeData.confirmation_time && !cleanTradeData.confirmation_time.includes(':')) {
            cleanTradeData.confirmation_time = `${cleanTradeData.confirmation_time}:00`;
          }
          if (cleanTradeData.entry_time && !cleanTradeData.entry_time.includes(':')) {
            cleanTradeData.entry_time = `${cleanTradeData.entry_time}:00`;
          }
          
          // Ensure day is set
          if (!cleanTradeData.day) {
            cleanTradeData.day = calculateDay(cleanTradeData.date);
            console.log(`Setting day for trade ${index + 1} to ${cleanTradeData.day} from date ${cleanTradeData.date}`);
          }
          
          // Ensure confirmation_time and entry_time are not empty
          if (!cleanTradeData.confirmation_time) {
            cleanTradeData.confirmation_time = '00:00';
          }
          if (!cleanTradeData.entry_time) {
            cleanTradeData.entry_time = '00:00';
          }
          
          // For debugging
          console.log(`Trade ${index + 1} data:`, cleanTradeData);
          
          await db.createTrade(cleanTradeData);
          return { success: true, index };
        } catch (err) {
          console.error(`Error importing trade ${index + 1}:`, err);
          return { 
            success: false, 
            index, 
            error: `Error importing trade ${index + 1}: ${err.message}` 
          };
        }
      });
      
      // Wait for all imports to complete
      const results = await Promise.all(importPromises);
      
      // Count successes and failures
      results.forEach(result => {
        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(result.error);
        }
      });
      
      console.log(`Import complete: ${successful} successful, ${failed} failed`);
      
      setImportResult({
        total: validImportData.length,
        successful,
        failed,
        errors
      });
      
      // Notify parent component that import is complete
      if (successful > 0 && onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error importing trades:', error);
      setError(`Error importing trades: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Import Trades
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Step 1: Upload CSV */}
        {activeStep === 0 && (
          <Box>
            <DialogContentText sx={{ mb: 2 }}>
              Please select a CSV file containing trade data to import.
            </DialogContentText>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 2 }}
              >
                Select CSV File
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleFileSelect}
                />
              </Button>
              
              {csvFile && (
                <Typography variant="subtitle1">
                  Selected file: {csvFile.name}
                </Typography>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                  {error}
                </Alert>
              )}
              
              {isProcessing && (
                <CircularProgress sx={{ mt: 2 }} />
              )}
              
              {parsedData && (
                <Box sx={{ mt: 2, width: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    CSV Preview (first 5 rows):
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {parsedData.meta.fields.map((field) => (
                            <TableCell key={field}>{field}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parsedData.data.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            {parsedData.meta.fields.map((field) => (
                              <TableCell key={field}>{row[field]}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          </Box>
        )}
        
        {/* Step 2: Map Columns */}
        {activeStep === 1 && parsedData && (
          <Box>
            <DialogContentText sx={{ mb: 2 }}>
              Map CSV columns to trade fields. Required fields are marked with an asterisk (*).
            </DialogContentText>
            
            <Grid container spacing={2}>
              {tradeFields.map((field) => (
                <Grid item xs={12} sm={6} md={4} key={field.name}>
                  <FormControl 
                    fullWidth 
                    error={!!mappingErrors[field.name]}
                    required={field.required}
                  >
                    <InputLabel id={`map-label-${field.name}`}>
                      {field.label}
                    </InputLabel>
                    <Select
                      labelId={`map-label-${field.name}`}
                      value={columnMapping[field.name] || ''}
                      onChange={(e) => handleMappingChange(field.name, e.target.value)}
                      label={`${field.label}${field.required ? ' *' : ''}`}
                    >
                      <MenuItem value="">
                        <em>Not Mapped</em>
                      </MenuItem>
                      {parsedData.meta.fields.map((csvColumn) => (
                        <MenuItem key={csvColumn} value={csvColumn}>
                          {csvColumn}
                        </MenuItem>
                      ))}
                    </Select>
                    {mappingErrors[field.name] && (
                      <Typography variant="caption" color="error">
                        {mappingErrors[field.name]}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        
        {/* Step 3: Import Data */}
        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {!importResult ? (
              <>
                <DialogContentText sx={{ mb: 2 }}>
                  Click "Import" to start importing trades.
                </DialogContentText>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">
                    Ready to import {parsedData?.data.length || 0} trades
                  </Typography>
                </Box>
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                    {error}
                  </Alert>
                )}
                
                {isProcessing && (
                  <CircularProgress sx={{ mt: 2 }} />
                )}
              </>
            ) : (
              <Box sx={{ mt: 2, width: '100%' }}>
                <Alert 
                  severity={importResult.failed > 0 ? "warning" : "success"}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle1">
                    Import Summary
                  </Typography>
                  <Typography variant="body2">
                    Total trades: {importResult.total}
                  </Typography>
                  <Typography variant="body2">
                    Successfully imported: {importResult.successful}
                  </Typography>
                  {importResult.failed > 0 && (
                    <Typography variant="body2">
                      Failed to import: {importResult.failed}
                    </Typography>
                  )}
                </Alert>
                
                {importResult.errors && importResult.errors.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" color="error">
                      Import Errors:
                    </Typography>
                    <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                      {importResult.errors.map((err, index) => (
                        <Typography key={index} variant="body2">
                          • {err}
                        </Typography>
                      ))}
                    </Paper>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {activeStep > 0 && !importResult && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        {activeStep < 2 && (
          <Button 
            onClick={handleNext}
            variant="contained"
            disabled={isProcessing || (activeStep === 0 && !parsedData)}
          >
            Next
          </Button>
        )}
        {activeStep === 2 && !importResult && (
          <Button 
            onClick={handleImport}
            variant="contained"
            color="primary"
            disabled={isProcessing}
          >
            Import
          </Button>
        )}
        {importResult && (
          <Button 
            onClick={onClose}
            variant="contained"
            color="primary"
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportTradesDialog;

/*
CSV File Format Requirements
The CSV file should contain columns that match the trade fields in the application. Here's a list of the main fields:

date: Trade date (YYYY-MM-DD format) important to use this format!!!
confirmation_time: Time of confirmation (HH:MM format)
entry_time: Time of entry (HH:MM format)
instrument: Name of the instrument (will be mapped to instrument_id)
confirmation_type: Type of confirmation (e.g., "Wick Confirmation")
direction: "Long" or "Short"
session: "ODR" or "RDR"
entry_method: Name of the entry method (will be mapped to entry_method_id)
entry: Entry price
stop: Stop price
target: Target price
exit: Exit price (optional)
*/