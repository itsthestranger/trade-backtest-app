// src/database/models/confluences.js
const db = require('../db');

// Confluence model for handling confluence data operations
class ConfluenceModel {
  // Create a new confluence
  async create(confluenceData) {
    try {
      // Check if confluence with this name already exists
      const existingConfluence = await db.get(
        'SELECT * FROM confluences WHERE name = ?',
        [confluenceData.name]
      );
      
      if (existingConfluence) {
        throw new Error(`Confluence with name '${confluenceData.name}' already exists`);
      }
      
      // Insert the confluence
      const sql = `INSERT INTO confluences (name) VALUES (?)`;
      const params = [confluenceData.name];
      
      const { id } = await db.run(sql, params);
      
      return { id, ...confluenceData };
    } catch (error) {
      console.error('Error creating confluence:', error);
      throw error;
    }
  }
  
  // Get a confluence by ID
  async getById(id) {
    try {
      const confluence = await db.get('SELECT * FROM confluences WHERE id = ?', [id]);
      
      if (!confluence) {
        return null;
      }
      
      return confluence;
    } catch (error) {
      console.error('Error getting confluence:', error);
      throw error;
    }
  }
  
  // Get all confluences
  async getAll() {
    try {
      const confluences = await db.all('SELECT * FROM confluences ORDER BY name');
      return confluences;
    } catch (error) {
      console.error('Error getting all confluences:', error);
      throw error;
    }
  }
  
  // Update a confluence
  async update(id, confluenceData) {
    try {
      // Check if confluence exists
      const existingConfluence = await this.getById(id);
      
      if (!existingConfluence) {
        throw new Error(`Confluence with ID ${id} not found`);
      }
      
      // Check if update would create a duplicate name
      if (confluenceData.name) {
        const duplicateCheck = await db.get(
          'SELECT * FROM confluences WHERE name = ? AND id != ?',
          [confluenceData.name, id]
        );
        
        if (duplicateCheck) {
          throw new Error(`Confluence with name '${confluenceData.name}' already exists`);
        }
      }
      
      // Update the confluence
      const sql = `UPDATE confluences SET name = ? WHERE id = ?`;
      const params = [confluenceData.name, id];
      
      await db.run(sql, params);
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating confluence:', error);
      throw error;
    }
  }
  
  // Delete a confluence
  async delete(id) {
    try {
      // Check if confluence is used in any trades
      const tradeCheck = await db.get(
        `SELECT COUNT(*) as count FROM trade_confluences WHERE confluence_id = ?`,
        [id]
      );
      
      if (tradeCheck.count > 0) {
        throw new Error(`Cannot delete confluence: it is used in ${tradeCheck.count} trades`);
      }
      
      // Check if confluence is used in any backtests
      const backtestCheck = await db.get(
        `SELECT COUNT(*) as count FROM backtest_confluences WHERE confluence_id = ?`,
        [id]
      );
      
      if (backtestCheck.count > 0) {
        throw new Error(`Cannot delete confluence: it is used in ${backtestCheck.count} backtests`);
      }
      
      // Delete the confluence
      await db.run('DELETE FROM confluences WHERE id = ?', [id]);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting confluence:', error);
      throw error;
    }
  }
  
  // Get settings for minimum confluences required
  async getMinConfluencesRequired() {
    try {
      const settings = await db.get('SELECT min_confluences FROM settings WHERE id = 1');
      
      if (!settings) {
        // Create default settings if not exist
        await db.run('INSERT OR IGNORE INTO settings (id, min_confluences) VALUES (1, 3)');
        return 3;
      }
      
      return settings.min_confluences;
    } catch (error) {
      console.error('Error getting min confluences setting:', error);
      throw error;
    }
  }
  
  // Update settings for minimum confluences required
  async updateMinConfluencesRequired(value) {
    try {
      const minConfluences = parseInt(value, 10);
      
      if (isNaN(minConfluences) || minConfluences < 1) {
        throw new Error('Minimum confluences must be a positive number');
      }
      
      await db.run(
        'UPDATE settings SET min_confluences = ? WHERE id = 1',
        [minConfluences]
      );
      
      return { min_confluences: minConfluences };
    } catch (error) {
      console.error('Error updating min confluences setting:', error);
      throw error;
    }
  }
}

module.exports = new ConfluenceModel();