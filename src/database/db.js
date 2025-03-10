// src/database/db.js
const BetterSQLite3 = require('better-sqlite3'); // Rename the import
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Get the user data directory
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'tradebacktesting.db');

// Ensure the DB directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Create a wrapper for better-sqlite3
class Database {
  constructor() {
    try {
      this.db = new BetterSQLite3(dbPath); // Use the renamed import
      console.log('Connected to SQLite database');
      this.initDatabase();
    } catch (err) {
      console.error('Could not connect to database', err);
    }
  }

  run(sql, params = []) {
    try {
      const statement = this.db.prepare(sql);
      const result = statement.run(...params);
      return Promise.resolve({ id: result.lastInsertRowid });
    } catch (err) {
      console.error('Error running sql ' + sql);
      console.error(err);
      return Promise.reject(err);
    }
  }

  get(sql, params = []) {
    try {
      const statement = this.db.prepare(sql);
      const result = statement.get(...params);
      return Promise.resolve(result);
    } catch (err) {
      console.error('Error running sql: ' + sql);
      console.error(err);
      return Promise.reject(err);
    }
  }

  all(sql, params = []) {
    try {
      const statement = this.db.prepare(sql);
      const rows = statement.all(...params);
      return Promise.resolve(rows);
    } catch (err) {
      console.error('Error running sql: ' + sql);
      console.error(err);
      return Promise.reject(err);
    }
  }

  async initDatabase() {
    // Read the schema SQL
    const schemaSql = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );
    
    // Execute the schema SQL - split by semicolons to run multiple statements
    const statements = schemaSql
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Start a transaction for all statements
    const transaction = this.db.transaction(() => {
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            this.db.exec(statement);
          } catch (err) {
            console.error('Error initializing database schema', err);
          }
        }
      }
    });
    
    try {
      transaction();
      console.log('Database schema initialized');
    } catch (err) {
      console.error('Error executing transaction', err);
    }
    // Then, check if we need to add the backtest_id column
    try {
      // Check if backtest_id column exists
      const tableInfo = await this.all("PRAGMA table_info(trades)");
      const hasBacktestId = tableInfo.some(column => column.name === 'backtest_id');
      
      if (!hasBacktestId) {
          console.log('Adding backtest_id column to trades table...');
          await this.run('ALTER TABLE trades ADD COLUMN backtest_id INTEGER REFERENCES backtests(id)');
          console.log('Migration complete');
      }
    } catch (err) {
        console.error('Error during migration:', err);
    }
    // Then, check if we need to add the dollars_per_tick column
    try {
      // Check if dollars_per_tick column exists
      const instrumentsTableInfo = await this.all("PRAGMA table_info(instruments)");
      const hasDollarsPerTick = instrumentsTableInfo.some(column => column.name === 'dollars_per_tick');
      
      if (!hasDollarsPerTick) {
        console.log('Adding dollars_per_tick column to instruments table...');
        await this.run('ALTER TABLE instruments ADD COLUMN dollars_per_tick REAL NOT NULL DEFAULT 1.0');
        console.log('Migration for dollars_per_tick complete');
      }
    } catch (err) {
      console.error('Error during dollars_per_tick migration:', err);
    }
  }

  // Backup the database to a specified path
  backup(backupPath) {
    return new Promise((resolve, reject) => {
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      try {
        // better-sqlite3 backup API
        const backup = this.db.backup(backupPath);
        backup.step(-1); // -1 means copy everything at once
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  // Restore the database from a specified path
  restore(restorePath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(restorePath)) {
        reject(new Error(`Backup file not found at ${restorePath}`));
        return;
      }

      try {
        // Close the current database
        this.db.close();
        
        // Copy the backup file to the database location
        fs.copyFileSync(restorePath, dbPath);
        
        // Reopen the database connection
        this.db = new BetterSQLite3(dbPath);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  close() {
    try {
      this.db.close();
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

// Create and export database instance
const database = new Database();
module.exports = database;