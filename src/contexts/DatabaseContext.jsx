// src/contexts/DatabaseContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
const { ipcRenderer } = window.require('electron');

// Create context
const DatabaseContext = createContext();

// Custom hook for using the database context
export const useDatabase = () => {
  return useContext(DatabaseContext);
};

// Database provider component
export const DatabaseProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize database connection
  useEffect(() => {
    const initDatabase = async () => {
      try {
        // Send a message to the main process to initialize the database
        await ipcRenderer.invoke('init-database');
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('Failed to connect to the database. Please restart the application.');
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  // Generic function to invoke database operations via IPC
  const invokeDb = async (channel, ...args) => {
    try {
      return await ipcRenderer.invoke(channel, ...args);
    } catch (err) {
      console.error(`Error invoking ${channel}:`, err);
      setError(`Database operation failed: ${err.message}`);
      throw err;
    }
  };

  // Database operations
  const db = {
    // Trade operations
    getTrades: (filters) => invokeDb('get-trades', filters),
    getTrade: (id) => invokeDb('get-trade', id),
    createTrade: (tradeData) => invokeDb('create-trade', tradeData),
    updateTrade: (id, tradeData) => invokeDb('update-trade', id, tradeData),
    deleteTrade: (id) => invokeDb('delete-trade', id),
    
    // Backtest operations
    getBacktests: () => invokeDb('get-backtests'),
    getBacktest: (id) => invokeDb('get-backtest', id),
    createBacktest: (backtestData) => invokeDb('create-backtest', backtestData),
    updateBacktest: (id, backtestData) => invokeDb('update-backtest', id, backtestData),
    deleteBacktest: (id) => invokeDb('delete-backtest', id),
    
    // Playbook operations
    getPlaybooks: () => invokeDb('get-playbooks'),
    getPlaybook: (id) => invokeDb('get-playbook', id),
    createPlaybook: (playbookData) => invokeDb('create-playbook', playbookData),
    updatePlaybook: (id, playbookData) => invokeDb('update-playbook', id, playbookData),
    deletePlaybook: (id) => invokeDb('delete-playbook', id),
    
    // Settings operations
    getInstruments: () => invokeDb('get-instruments'),
    createInstrument: (instrumentData) => invokeDb('create-instrument', instrumentData),
    updateInstrument: (id, instrumentData) => invokeDb('update-instrument', id, instrumentData),
    deleteInstrument: (id) => invokeDb('delete-instrument', id),
    
    getEntryMethods: () => invokeDb('get-entry-methods'),
    createEntryMethod: (entryMethodData) => invokeDb('create-entry-method', entryMethodData),
    updateEntryMethod: (id, entryMethodData) => invokeDb('update-entry-method', id, entryMethodData),
    deleteEntryMethod: (id) => invokeDb('delete-entry-method', id),
    
    getAccounts: () => invokeDb('get-accounts'),
    createAccount: (accountData) => invokeDb('create-account', accountData),
    updateAccount: (id, accountData) => invokeDb('update-account', id, accountData),
    deleteAccount: (id) => invokeDb('delete-account', id),
    
    getConfluences: () => invokeDb('get-confluences'),
    createConfluence: (confluenceData) => invokeDb('create-confluence', confluenceData),
    updateConfluence: (id, confluenceData) => invokeDb('update-confluence', id, confluenceData),
    deleteConfluence: (id) => invokeDb('delete-confluence', id),
    
    getSettings: () => invokeDb('get-settings'),
    updateSettings: (settingsData) => invokeDb('update-settings', settingsData),
    
    // Filter operations
    getFilters: () => invokeDb('get-filters'),
    createFilter: (filterData) => invokeDb('create-filter', filterData),
    updateFilter: (id, filterData) => invokeDb('update-filter', id, filterData),
    deleteFilter: (id) => invokeDb('delete-filter', id),
    
    // Dashboard operations
    getKPIs: () => invokeDb('get-kpis'),
    getWeeklyMetrics: () => invokeDb('get-weekly-metrics'),
    
    // Backup and restore
    backupDatabase: (path) => invokeDb('backup-database', path),
    restoreDatabase: (path) => invokeDb('restore-database', path),
    
    // Clear error
    clearError: () => setError(null),
  };

  // Value to be provided by the context
  const value = {
    isLoading,
    error,
    db,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};