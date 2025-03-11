// src/database/models/backtests.js
const db = require('../db');

// Backtest model for handling backtest data operations
class BacktestModel {
  // Create a new backtest
  async create(backtestData) {
    try {
      const sql = `
        INSERT INTO backtests (
          name,
          info
        ) VALUES (?, ?)
      `;
      
      const params = [
        backtestData.name,
        backtestData.info || null
      ];
      
      const { id } = await db.run(sql, params);
      
      // If confluences are provided, save them
      if (backtestData.confluences && backtestData.confluences.length > 0) {
        await this.saveConfluences(id, backtestData.confluences);
      }
      
      return { id, ...backtestData };
    } catch (error) {
      console.error('Error creating backtest:', error);
      throw error;
    }
  }
  
  // Get a backtest by ID with its confluences
  async getById(id) {
    try {
      const backtest = await db.get('SELECT * FROM backtests WHERE id = ?', [id]);
      
      if (!backtest) {
        return null;
      }
      
      // Get confluences
      const confluences = await db.all(
        `SELECT c.id, c.name
         FROM confluences c
         JOIN backtest_confluences bc ON c.id = bc.confluence_id
         WHERE bc.backtest_id = ?`,
        [id]
      );
      
      return {
        ...backtest,
        confluences: confluences.map(c => ({ id: c.id, name: c.name }))
      };
    } catch (error) {
      console.error('Error getting backtest:', error);
      throw error;
    }
  }
  
  // Get all backtests with their confluences
  async getAll() {
    try {
      const backtests = await db.all('SELECT * FROM backtests ORDER BY name');
      
      // Get confluences for each backtest
      const backtestsWithConfluences = await Promise.all(
        backtests.map(async (backtest) => {
          const confluences = await db.all(
            `SELECT c.id, c.name
             FROM confluences c
             JOIN backtest_confluences bc ON c.id = bc.confluence_id
             WHERE bc.backtest_id = ?`,
            [backtest.id]
          );
          
          return {
            ...backtest,
            confluences: confluences.map(c => ({ id: c.id, name: c.name }))
          };
        })
      );
      
      return backtestsWithConfluences;
    } catch (error) {
      console.error('Error getting all backtests:', error);
      throw error;
    }
  }
  
  // Update a backtest
  async update(id, backtestData) {
    try {
      // Update the backtest
      const sql = `
        UPDATE backtests SET
          name = COALESCE(?, name),
          info = COALESCE(?, info)
        WHERE id = ?
      `;
      
      const params = [
        backtestData.name,
        backtestData.info,
        id
      ];
      
      await db.run(sql, params);
      
      // If confluences are provided, update them
      if (backtestData.confluences !== undefined) {
        await this.updateConfluences(id, backtestData.confluences);
      }
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating backtest:', error);
      throw error;
    }
  }
  
  // Delete a backtest
  async delete(id) {
    try {
      // Delete backtest confluences
      await db.run('DELETE FROM backtest_confluences WHERE backtest_id = ?', [id]);
      
      // Delete the backtest
      await db.run('DELETE FROM backtests WHERE id = ?', [id]);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting backtest:', error);
      throw error;
    }
  }
  
  // Save confluences for a backtest
  async saveConfluences(backtestId, confluenceIds) {
    try {
      // First delete existing confluences for this backtest
      await db.run('DELETE FROM backtest_confluences WHERE backtest_id = ?', [backtestId]);
      
      // Then insert new confluences
      for (const confluenceId of confluenceIds) {
        await db.run(
          'INSERT INTO backtest_confluences (backtest_id, confluence_id) VALUES (?, ?)',
          [backtestId, confluenceId]
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving backtest confluences:', error);
      throw error;
    }
  }
  
  // Update confluences for a backtest
  async updateConfluences(backtestId, confluenceIds) {
    return this.saveConfluences(backtestId, confluenceIds);
  }
}

module.exports = new BacktestModel();