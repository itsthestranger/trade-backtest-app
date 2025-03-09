// public/electron.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

// Database Models
const tradeModel = require('../src/database/models/trades');
const backtestModel = require('../src/database/models/backtests');
const playbookModel = require('../src/database/models/playbooks');
const instrumentModel = require('../src/database/models/instruments');
const entryMethodModel = require('../src/database/models/entryMethods');
const accountModel = require('../src/database/models/accounts');
const confluenceModel = require('../src/database/models/confluences');
const filterModel = require('../src/database/models/filters');

// Utils
const exportImportUtils = require('../src/utils/exportImport');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png')
  });

  // and load the index.html of the app.
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Main handlers

// Database initialization
ipcMain.handle('init-database', async () => {
  // Database initialization is handled in db.js
  return { success: true };
});

// Trade operations
ipcMain.handle('get-trades', async (event, filters) => {
  return await tradeModel.getAll(filters);
});

ipcMain.handle('get-trade', async (event, id) => {
  return await tradeModel.getById(id);
});

ipcMain.handle('create-trade', async (event, tradeData) => {
  return await tradeModel.create(tradeData);
});

ipcMain.handle('update-trade', async (event, id, tradeData) => {
  return await tradeModel.update(id, tradeData);
});

ipcMain.handle('delete-trade', async (event, id) => {
  return await tradeModel.delete(id);
});

// Backtest operations
ipcMain.handle('get-backtests', async () => {
  return await backtestModel.getAll();
});

ipcMain.handle('get-backtest', async (event, id) => {
  return await backtestModel.getById(id);
});

ipcMain.handle('create-backtest', async (event, backtestData) => {
  return await backtestModel.create(backtestData);
});

ipcMain.handle('update-backtest', async (event, id, backtestData) => {
  return await backtestModel.update(id, backtestData);
});

ipcMain.handle('delete-backtest', async (event, id) => {
  return await backtestModel.delete(id);
});

// Playbook operations
ipcMain.handle('get-playbooks', async () => {
  return await playbookModel.getAll();
});

ipcMain.handle('get-playbook', async (event, id) => {
  return await playbookModel.getById(id);
});

ipcMain.handle('create-playbook', async (event, playbookData) => {
  return await playbookModel.create(playbookData);
});

ipcMain.handle('update-playbook', async (event, id, playbookData) => {
  return await playbookModel.update(id, playbookData);
});

ipcMain.handle('delete-playbook', async (event, id) => {
  return await playbookModel.delete(id);
});

// Instrument operations
ipcMain.handle('get-instruments', async () => {
  return await instrumentModel.getAll();
});

ipcMain.handle('create-instrument', async (event, instrumentData) => {
  return await instrumentModel.create(instrumentData);
});

ipcMain.handle('update-instrument', async (event, id, instrumentData) => {
  return await instrumentModel.update(id, instrumentData);
});

ipcMain.handle('delete-instrument', async (event, id) => {
  return await instrumentModel.delete(id);
});

// Entry method operations
ipcMain.handle('get-entry-methods', async () => {
  return await entryMethodModel.getAll();
});

ipcMain.handle('create-entry-method', async (event, entryMethodData) => {
  return await entryMethodModel.create(entryMethodData);
});

ipcMain.handle('update-entry-method', async (event, id, entryMethodData) => {
  return await entryMethodModel.update(id, entryMethodData);
});

ipcMain.handle('delete-entry-method', async (event, id) => {
  return await entryMethodModel.delete(id);
});

// Account operations
ipcMain.handle('get-accounts', async () => {
  return await accountModel.getAll();
});

ipcMain.handle('create-account', async (event, accountData) => {
  return await accountModel.create(accountData);
});

ipcMain.handle('update-account', async (event, id, accountData) => {
  return await accountModel.update(id, accountData);
});

ipcMain.handle('delete-account', async (event, id) => {
  return await accountModel.delete(id);
});

// Confluence operations
ipcMain.handle('get-confluences', async () => {
  return await confluenceModel.getAll();
});

ipcMain.handle('create-confluence', async (event, confluenceData) => {
  return await confluenceModel.create(confluenceData);
});

ipcMain.handle('update-confluence', async (event, id, confluenceData) => {
  return await confluenceModel.update(id, confluenceData);
});

ipcMain.handle('delete-confluence', async (event, id) => {
  return await confluenceModel.delete(id);
});

// Settings operations
ipcMain.handle('get-settings', async () => {
  const minConfluences = await confluenceModel.getMinConfluencesRequired();
  return { min_confluences: minConfluences };
});

ipcMain.handle('update-settings', async (event, settingsData) => {
  if (settingsData.min_confluences !== undefined) {
    return await confluenceModel.updateMinConfluencesRequired(settingsData.min_confluences);
  }
  return { success: false, error: 'No settings to update' };
});

// Filter operations
ipcMain.handle('get-filters', async () => {
  return await filterModel.getAll();
});

ipcMain.handle('create-filter', async (event, filterData) => {
  return await filterModel.create(filterData);
});

ipcMain.handle('update-filter', async (event, id, filterData) => {
  return await filterModel.update(id, filterData);
});

ipcMain.handle('delete-filter', async (event, id) => {
  return await filterModel.delete(id);
});

// Dashboard operations
ipcMain.handle('get-kpis', async () => {
  return await tradeModel.getKPIs();
});

ipcMain.handle('get-weekly-metrics', async () => {
  return await tradeModel.getWeeklyMetrics();
});

// Backup and restore operations
ipcMain.handle('backup-database', async (event, customPath) => {
  try {
    // If customPath is not provided, use default location in app data directory
    let backupPath;
    
    if (!customPath) {
      const userDataPath = app.getPath('userData');
      const backupDir = path.join(userDataPath, 'DB-Backup');
      
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      backupPath = await exportImportUtils.createBackup(backupDir);
    } else {
      backupPath = await exportImportUtils.createBackup(customPath);
    }
    
    return { success: true, path: backupPath };
  } catch (error) {
    console.error('Error backing up database:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-database', async (event, filePath) => {
  try {
    // If filePath is not provided, show open file dialog
    let backupPath = filePath;
    
    if (!backupPath) {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Database Files', extensions: ['db'] }]
      });
      
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'No file selected' };
      }
      
      backupPath = result.filePaths[0];
    }
    
    await exportImportUtils.restoreFromBackup(backupPath);
    
    // Show success message and prompt to restart app
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Restore Successful',
      message: 'Database restored successfully. The application will now restart to apply changes.',
      buttons: ['OK']
    }).then(() => {
      app.relaunch();
      app.exit();
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error restoring database:', error);
    return { success: false, error: error.message };
  }
});

// Get available backups
ipcMain.handle('get-available-backups', async () => {
  try {
    const backups = await exportImportUtils.getAvailableBackups();
    return { success: true, backups };
  } catch (error) {
    console.error('Error getting available backups:', error);
    return { success: false, error: error.message };
  }
});

// Delete backup
ipcMain.handle('delete-backup', async (event, backupPath) => {
  try {
    await exportImportUtils.deleteBackup(backupPath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting backup:', error);
    return { success: false, error: error.message };
  }
});

// Export to JSON
ipcMain.handle('export-to-json', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Data',
      defaultPath: path.join(app.getPath('documents'), 'trade_data_export.json'),
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    
    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export canceled' };
    }
    
    const exportPath = await exportImportUtils.exportToJson(result.filePath);
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    return { success: false, error: error.message };
  }
});

// Import from JSON
ipcMain.handle('import-from-json', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Data',
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Import canceled' };
    }
    
    // Show confirmation dialog
    const confirmResult = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Confirm Import',
      message: 'Importing will replace all existing data. This cannot be undone. Do you want to create a backup first?',
      buttons: ['Create Backup and Import', 'Import Without Backup', 'Cancel'],
      defaultId: 0,
      cancelId: 2
    });
    
    if (confirmResult.response === 2) {
      return { success: false, error: 'Import canceled' };
    }
    
    // Create backup if requested
    if (confirmResult.response === 0) {
      await exportImportUtils.createBackup();
    }
    
    await exportImportUtils.importFromJson(result.filePaths[0]);
    
    // Show success message and prompt to restart app
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Import Successful',
      message: 'Data imported successfully. The application will now restart to apply changes.',
      buttons: ['OK']
    }).then(() => {
      app.relaunch();
      app.exit();
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error importing from JSON:', error);
    return { success: false, error: error.message };
  }
});