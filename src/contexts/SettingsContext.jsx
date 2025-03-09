// src/contexts/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDatabase } from './DatabaseContext';

// Create context
const SettingsContext = createContext();

// Custom hook for using the settings context
export const useSettings = () => {
  return useContext(SettingsContext);
};

// Settings provider component
export const SettingsProvider = ({ children }) => {
  const { db, isLoading: dbLoading } = useDatabase();
  
  const [instruments, setInstruments] = useState([]);
  const [entryMethods, setEntryMethods] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [confluences, setConfluences] = useState([]);
  const [minConfluences, setMinConfluences] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (dbLoading) return;
      
      try {
        setIsLoading(true);
        
        // Load instruments
        const instrumentsData = await db.getInstruments();
        setInstruments(instrumentsData);
        
        // Load entry methods
        const entryMethodsData = await db.getEntryMethods();
        setEntryMethods(entryMethodsData);
        
        // Load accounts
        const accountsData = await db.getAccounts();
        setAccounts(accountsData);
        
        // Load confluences
        const confluencesData = await db.getConfluences();
        setConfluences(confluencesData);
        
        // Load general settings
        const settingsData = await db.getSettings();
        if (settingsData && settingsData.min_confluences) {
          setMinConfluences(settingsData.min_confluences);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading settings:', error);
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [db, dbLoading]);

  // Functions to manage instruments
  const addInstrument = async (instrumentData) => {
    try {
      const newInstrument = await db.createInstrument(instrumentData);
      setInstruments([...instruments, newInstrument]);
      return newInstrument;
    } catch (error) {
      console.error('Error adding instrument:', error);
      throw error;
    }
  };
  
  const updateInstrument = async (id, instrumentData) => {
    try {
      const updatedInstrument = await db.updateInstrument(id, instrumentData);
      setInstruments(
        instruments.map((instrument) =>
          instrument.id === id ? updatedInstrument : instrument
        )
      );
      return updatedInstrument;
    } catch (error) {
      console.error('Error updating instrument:', error);
      throw error;
    }
  };
  
  const deleteInstrument = async (id) => {
    try {
      await db.deleteInstrument(id);
      setInstruments(instruments.filter((instrument) => instrument.id !== id));
    } catch (error) {
      console.error('Error deleting instrument:', error);
      throw error;
    }
  };

  // Functions to manage entry methods
  const addEntryMethod = async (entryMethodData) => {
    try {
      const newEntryMethod = await db.createEntryMethod(entryMethodData);
      setEntryMethods([...entryMethods, newEntryMethod]);
      return newEntryMethod;
    } catch (error) {
      console.error('Error adding entry method:', error);
      throw error;
    }
  };
  
  const updateEntryMethod = async (id, entryMethodData) => {
    try {
      const updatedEntryMethod = await db.updateEntryMethod(id, entryMethodData);
      setEntryMethods(
        entryMethods.map((entryMethod) =>
          entryMethod.id === id ? updatedEntryMethod : entryMethod
        )
      );
      return updatedEntryMethod;
    } catch (error) {
      console.error('Error updating entry method:', error);
      throw error;
    }
  };
  
  const deleteEntryMethod = async (id) => {
    try {
      await db.deleteEntryMethod(id);
      setEntryMethods(entryMethods.filter((entryMethod) => entryMethod.id !== id));
    } catch (error) {
      console.error('Error deleting entry method:', error);
      throw error;
    }
  };

  // Functions to manage accounts
  const addAccount = async (accountData) => {
    try {
      const newAccount = await db.createAccount(accountData);
      setAccounts([...accounts, newAccount]);
      return newAccount;
    } catch (error) {
      console.error('Error adding account:', error);
      throw error;
    }
  };
  
  const updateAccount = async (id, accountData) => {
    try {
      const updatedAccount = await db.updateAccount(id, accountData);
      setAccounts(
        accounts.map((account) =>
          account.id === id ? updatedAccount : account
        )
      );
      return updatedAccount;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  };
  
  const deleteAccount = async (id) => {
    try {
      await db.deleteAccount(id);
      setAccounts(accounts.filter((account) => account.id !== id));
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  // Functions to manage confluences
  const addConfluence = async (confluenceData) => {
    try {
      const newConfluence = await db.createConfluence(confluenceData);
      setConfluences([...confluences, newConfluence]);
      return newConfluence;
    } catch (error) {
      console.error('Error adding confluence:', error);
      throw error;
    }
  };
  
  const updateConfluence = async (id, confluenceData) => {
    try {
      const updatedConfluence = await db.updateConfluence(id, confluenceData);
      setConfluences(
        confluences.map((confluence) =>
          confluence.id === id ? updatedConfluence : confluence
        )
      );
      return updatedConfluence;
    } catch (error) {
      console.error('Error updating confluence:', error);
      throw error;
    }
  };
  
  const deleteConfluence = async (id) => {
    try {
      await db.deleteConfluence(id);
      setConfluences(confluences.filter((confluence) => confluence.id !== id));
    } catch (error) {
      console.error('Error deleting confluence:', error);
      throw error;
    }
  };

  // Function to update min confluences
  const updateMinConfluences = async (value) => {
    try {
      await db.updateSettings({ min_confluences: value });
      setMinConfluences(value);
    } catch (error) {
      console.error('Error updating min confluences:', error);
      throw error;
    }
  };

  // Value to be provided by the context
  const value = {
    instruments,
    entryMethods,
    accounts,
    confluences,
    minConfluences,
    isLoading,
    
    // Instrument functions
    addInstrument,
    updateInstrument,
    deleteInstrument,
    
    // Entry method functions
    addEntryMethod,
    updateEntryMethod,
    deleteEntryMethod,
    
    // Account functions
    addAccount,
    updateAccount,
    deleteAccount,
    
    // Confluence functions
    addConfluence,
    updateConfluence,
    deleteConfluence,
    
    // Settings functions
    updateMinConfluences,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};