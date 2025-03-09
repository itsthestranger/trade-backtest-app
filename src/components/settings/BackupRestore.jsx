// src/components/settings/BackupRestore.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useDatabase } from '../../contexts/DatabaseContext';
import { format } from 'date-fns';

const BackupRestore = () => {
  const { db } = useDatabase();
  
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Handle backup
  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      setError(null);
      setBackupSuccess(false);
      
      // Generate filename with current date and time
      const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = `DB-Backup/tradebacktesting_backup_${dateStr}.db`;
      
      // Create backup
      await db.backupDatabase(filename);
      
      setBackupSuccess(true);
    } catch (error) {
      console.error('Error backing up database:', error);
      setError(`Backup failed: ${error.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };
  
  // Handle file input change
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setConfirmDialogOpen(true);
    }
  };
  
  // Handle restore
  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      setError(null);
      setRestoreSuccess(false);
      
      if (!selectedFile) {
        throw new Error('No file selected');
      }
      
      // Close confirm dialog
      setConfirmDialogOpen(false);
      
      // Get the file path
      const filePath = selectedFile.path;
      
      // Restore from backup
      await db.restoreDatabase(filePath);
      
      setRestoreSuccess(true);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error restoring database:', error);
      setError(`Restore failed: ${error.message}`);
    } finally {
      setIsRestoring(false);
    }
  };
  
  // Handle cancel restore
  const handleCancelRestore = () => {
    setConfirmDialogOpen(false);
    setSelectedFile(null);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Backup and Restore
      </Typography>
      
      <Grid container spacing={3}>
        {/* Backup Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BackupIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">
                  Backup Database
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Create a backup of your database with all your trades, playbooks, and settings.
                The backup file will be saved in the DB-Backup folder within the application directory.
              </Typography>
              
              {backupSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Backup completed successfully!
                </Alert>
              )}
              
              {error && error.includes('Backup failed') && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleBackup}
                disabled={isBackingUp}
                sx={{ ml: 1, mb: 1 }}
              >
                {isBackingUp ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} /> Backing Up...
                  </>
                ) : (
                  'Create Backup'
                )}
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Restore Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RestoreIcon fontSize="large" color="secondary" sx={{ mr: 2 }} />
                <Typography variant="h6">
                  Restore Database
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Restore your database from a previous backup. This will replace your current data
                with the data from the backup file. Make sure to create a backup before restoring.
              </Typography>
              
              {restoreSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Restore completed successfully! The application will now reload.
                </Alert>
              )}
              
              {error && error.includes('Restore failed') && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                disabled={isRestoring}
                sx={{ ml: 1, mb: 1 }}
              >
                Select Backup File
                <input
                  type="file"
                  accept=".db"
                  hidden
                  onChange={handleFileSelect}
                />
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {/* Restore Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelRestore}
      >
        <DialogTitle>Confirm Restore</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restore the database from file:
            <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
              {selectedFile?.name}
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
              Warning: This will replace your current database and all its data.
              This action cannot be undone unless you have a backup of your current data.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRestore}>Cancel</Button>
          <Button 
            onClick={handleRestore} 
            color="secondary" 
            variant="contained"
            disabled={isRestoring}
          >
            {isRestoring ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} /> Restoring...
              </>
            ) : (
              'Restore'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupRestore;