// src/utils/exportImport.js
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const db = require('../database/db');

/**
 * Create a backup of the database
 * @param {string} [customPath] - Custom path for the backup file
 * @returns {Promise<string>} - Path to the backup file
 */
const createBackup = async (customPath) => {
  try {
    // Get the user data directory
    const userDataPath = app.getPath('userData');
    
    // Create backup directory if it doesn't exist
    const backupDir = customPath || path.join(userDataPath, 'DB-Backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Generate the backup filename with current date and time
    const now = new Date();
    const dateString = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeString = now.toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0];
    const backupFilename = `tradebacktesting_backup_${dateString}_${timeString}.db`;
    const backupPath = path.join(backupDir, backupFilename);
    
    // Create the backup
    await db.backup(backupPath);
    
    return backupPath;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

/**
 * Restore database from a backup file
 * @param {string} backupPath - Path to the backup file
 * @returns {Promise<boolean>} - Whether the restore was successful
 */
const restoreFromBackup = async (backupPath) => {
  try {
    // Check if backup file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file does not exist: ${backupPath}`);
    }
    
    // Restore the database
    await db.restore(backupPath);
    
    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    throw error;
  }
};

/**
 * Get list of available backups
 * @returns {Promise<Array>} - Array of backup file info
 */
const getAvailableBackups = async () => {
  try {
    // Get the user data directory
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'DB-Backup');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      return [];
    }
    
    // Get all .db files in the backup directory
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        // Extract date from filename
        let date;
        const match = file.match(/tradebacktesting_backup_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
        if (match) {
          const dateStr = match[1];
          const timeStr = match[2].replace(/-/g, ':');
          date = new Date(`${dateStr}T${timeStr}`);
        } else {
          date = stats.mtime;
        }
        
        return {
          name: file,
          path: filePath,
          size: stats.size,
          date: date,
        };
      });
    
    // Sort by date (newest first)
    return files.sort((a, b) => b.date - a.date);
  } catch (error) {
    console.error('Error getting available backups:', error);
    throw error;
  }
};

/**
 * Delete a backup file
 * @param {string} backupPath - Path to the backup file
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
const deleteBackup = async (backupPath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file does not exist: ${backupPath}`);
    }
    
    // Delete the file
    fs.unlinkSync(backupPath);
    
    return true;
  } catch (error) {
    console.error('Error deleting backup:', error);
    throw error;
  }
};

/**
 * Export data from the database to a JSON file
 * @param {string} exportPath - Path to export the data to
 * @returns {Promise<string>} - Path to the exported file
 */
const exportToJson = async (exportPath) => {
  try {
    // Get all data from the database
    const data = {
      instruments: await db.all('SELECT * FROM instruments'),
      entryMethods: await db.all('SELECT * FROM entry_methods'),
      accounts: await db.all('SELECT * FROM accounts'),
      confluences: await db.all('SELECT * FROM confluences'),
      settings: await db.get('SELECT * FROM settings WHERE id = 1'),
      backtests: await db.all('SELECT * FROM backtests'),
      backtestConfluences: await db.all('SELECT * FROM backtest_confluences'),
      trades: await db.all('SELECT * FROM trades'),
      tradeDocumentation: await db.all('SELECT * FROM trade_documentation'),
      tradeConfluences: await db.all('SELECT * FROM trade_confluences'),
      filters: await db.all('SELECT * FROM filters'),
      filterConfluences: await db.all('SELECT * FROM filter_confluences'),
      playbooks: await db.all('SELECT * FROM playbooks'),
      playbookEntries: await db.all('SELECT * FROM playbook_entries'),
    };
    
    // Write to file
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    
    return exportPath;
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw error;
  }
};

/**
 * Import data from a JSON file to the database
 * @param {string} importPath - Path to the JSON file
 * @returns {Promise<boolean>} - Whether the import was successful
 */
const importFromJson = async (importPath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(importPath)) {
      throw new Error(`Import file does not exist: ${importPath}`);
    }
    
    // Read the file
    const data = JSON.parse(fs.readFileSync(importPath, 'utf8'));
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Clear existing data
      await db.run('DELETE FROM playbook_entries');
      await db.run('DELETE FROM playbooks');
      await db.run('DELETE FROM filter_confluences');
      await db.run('DELETE FROM filters');
      await db.run('DELETE FROM trade_confluences');
      await db.run('DELETE FROM trade_documentation');
      await db.run('DELETE FROM trades');
      await db.run('DELETE FROM backtest_confluences');
      await db.run('DELETE FROM backtests');
      await db.run('DELETE FROM confluences');
      await db.run('DELETE FROM accounts');
      await db.run('DELETE FROM entry_methods');
      await db.run('DELETE FROM instruments');
      await db.run('DELETE FROM settings');
      
      // Insert instruments
      for (const instrument of data.instruments) {
        await db.run(
          'INSERT INTO instruments (id, name, tick_value, color) VALUES (?, ?, ?, ?)',
          [instrument.id, instrument.name, instrument.tick_value, instrument.color]
        );
      }
      
      // Insert entry methods
      for (const method of data.entryMethods) {
        await db.run(
          'INSERT INTO entry_methods (id, name, description, color) VALUES (?, ?, ?, ?)',
          [method.id, method.name, method.description, method.color]
        );
      }
      
      // Insert accounts
      for (const account of data.accounts) {
        await db.run(
          'INSERT INTO accounts (id, name, size, risk_per_r, color) VALUES (?, ?, ?, ?, ?)',
          [account.id, account.name, account.size, account.risk_per_r, account.color]
        );
      }
      
      // Insert confluences
      for (const confluence of data.confluences) {
        await db.run(
          'INSERT INTO confluences (id, name) VALUES (?, ?)',
          [confluence.id, confluence.name]
        );
      }
      
      // Insert settings
      if (data.settings) {
        await db.run(
          'INSERT INTO settings (id, min_confluences) VALUES (?, ?)',
          [data.settings.id, data.settings.min_confluences]
        );
      } else {
        await db.run('INSERT INTO settings (id, min_confluences) VALUES (1, 3)');
      }
      
      // Insert backtests
      for (const backtest of data.backtests) {
        await db.run(
          'INSERT INTO backtests (id, name) VALUES (?, ?)',
          [backtest.id, backtest.name]
        );
      }
      
      // Insert backtest confluences
      for (const relation of data.backtestConfluences) {
        await db.run(
          'INSERT INTO backtest_confluences (backtest_id, confluence_id) VALUES (?, ?)',
          [relation.backtest_id, relation.confluence_id]
        );
      }
      
      // Insert trades
      for (const trade of data.trades) {
        await db.run(
          `INSERT INTO trades (
            id, date, day, confirmation_time, entry_time, instrument_id, confirmation_type,
            direction, session, entry_method_id, stopped_out, status, ret_entry,
            sd_exit, entry, stop, target, exit, stop_ticks, pot_result, result,
            preparation, entry_score, stop_loss, target_score, management, rules,
            average, planned_executed, account_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            trade.id, trade.date, trade.day, trade.confirmation_time, trade.entry_time, 
            trade.instrument_id, trade.confirmation_type, trade.direction, trade.session, 
            trade.entry_method_id, trade.stopped_out, trade.status, trade.ret_entry,
            trade.sd_exit, trade.entry, trade.stop, trade.target, trade.exit, 
            trade.stop_ticks, trade.pot_result, trade.result, trade.preparation, 
            trade.entry_score, trade.stop_loss, trade.target_score, trade.management, 
            trade.rules, trade.average, trade.planned_executed, trade.account_id
          ]
        );
      }
      
      // Insert trade documentation
      for (const doc of data.tradeDocumentation) {
        await db.run(
          'INSERT INTO trade_documentation (id, trade_id, trade_journal, body_mind_state) VALUES (?, ?, ?, ?)',
          [doc.id, doc.trade_id, doc.trade_journal, doc.body_mind_state]
        );
      }
      
      // Insert trade confluences
      for (const relation of data.tradeConfluences) {
        await db.run(
          'INSERT INTO trade_confluences (trade_id, confluence_id) VALUES (?, ?)',
          [relation.trade_id, relation.confluence_id]
        );
      }
      
      // Insert filters
      for (const filter of data.filters) {
        await db.run(
          `INSERT INTO filters (
            id, name, date_from, date_to, session, instrument_id, entry_method_id,
            account_id, average_metrics_from, average_metrics_to, confluences_logic,
            execution_status, confirmation_type, direction, status, days,
            stop_ticks_from, stop_ticks_to
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            filter.id, filter.name, filter.date_from, filter.date_to, filter.session,
            filter.instrument_id, filter.entry_method_id, filter.account_id,
            filter.average_metrics_from, filter.average_metrics_to, filter.confluences_logic,
            filter.execution_status, filter.confirmation_type, filter.direction,
            filter.status, filter.days, filter.stop_ticks_from, filter.stop_ticks_to
          ]
        );
      }
      
      // Insert filter confluences
      for (const relation of data.filterConfluences) {
        await db.run(
          'INSERT INTO filter_confluences (filter_id, confluence_id) VALUES (?, ?)',
          [relation.filter_id, relation.confluence_id]
        );
      }
      
      // Insert playbooks
      for (const playbook of data.playbooks) {
        await db.run(
          'INSERT INTO playbooks (id, name, instrument_id) VALUES (?, ?, ?)',
          [playbook.id, playbook.name, playbook.instrument_id]
        );
      }
      
      // Insert playbook entries
      for (const entry of data.playbookEntries) {
        await db.run(
          `INSERT INTO playbook_entries (
            id, playbook_id, day, direction, confirmation_time, mode_time_start,
            mode_time_end, time_cl_1_start, time_cl_1_end, ret_median_time,
            dropoff_time, ret_cluster_1_start, ret_cluster_1_end, ret_cluster_2_start,
            ret_cluster_2_end, ret_cluster_3_start, ret_cluster_3_end, ext_median_time,
            ext_cluster_1_start, ext_cluster_1_end, ext_cluster_2_start, ext_cluster_2_end
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id, entry.playbook_id, entry.day, entry.direction, entry.confirmation_time,
            entry.mode_time_start, entry.mode_time_end, entry.time_cl_1_start, entry.time_cl_1_end,
            entry.ret_median_time, entry.dropoff_time, entry.ret_cluster_1_start,
            entry.ret_cluster_1_end, entry.ret_cluster_2_start, entry.ret_cluster_2_end,
            entry.ret_cluster_3_start, entry.ret_cluster_3_end, entry.ext_median_time,
            entry.ext_cluster_1_start, entry.ext_cluster_1_end, entry.ext_cluster_2_start,
            entry.ext_cluster_2_end
          ]
        );
      }
      
      // Commit the transaction
      await db.run('COMMIT');
      
      return true;
    } catch (error) {
      // Rollback the transaction on error
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error importing from JSON:', error);
    throw error;
  }
};

module.exports = {
  createBackup,
  restoreFromBackup,
  getAvailableBackups,
  deleteBackup,
  exportToJson,
  importFromJson
};