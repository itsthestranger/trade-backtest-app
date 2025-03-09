// src/database/models/playbooks.js
const db = require('../db');

// Playbook model for handling playbook data operations
class PlaybookModel {
  // Create a new playbook
  async create(playbookData) {
    try {
      // Insert the playbook
      const sql = `
        INSERT INTO playbooks (
          name,
          instrument_id
        ) VALUES (?, ?)
      `;
      
      const params = [
        playbookData.name,
        playbookData.instrument_id
      ];
      
      const { id } = await db.run(sql, params);
      
      return { id, ...playbookData, entries: [] };
    } catch (error) {
      console.error('Error creating playbook:', error);
      throw error;
    }
  }
  
  // Get a playbook by ID with its entries
  async getById(id) {
    try {
      const playbook = await db.get('SELECT * FROM playbooks WHERE id = ?', [id]);
      
      if (!playbook) {
        return null;
      }
      
      // Get instrument details
      const instrument = await db.get(
        'SELECT * FROM instruments WHERE id = ?',
        [playbook.instrument_id]
      );
      
      // Get entries
      const entries = await db.all(
        'SELECT * FROM playbook_entries WHERE playbook_id = ? ORDER BY day, direction, confirmation_time',
        [id]
      );
      
      return {
        ...playbook,
        instrument,
        entries
      };
    } catch (error) {
      console.error('Error getting playbook:', error);
      throw error;
    }
  }
  
  // Get all playbooks
  async getAll() {
    try {
      const sql = `
        SELECT p.*, i.name as instrument_name, i.color as instrument_color
        FROM playbooks p
        JOIN instruments i ON p.instrument_id = i.id
        ORDER BY i.name, p.name
      `;
      
      const playbooks = await db.all(sql);
      
      // Count entries for each playbook
      for (const playbook of playbooks) {
        const count = await db.get(
          'SELECT COUNT(*) as count FROM playbook_entries WHERE playbook_id = ?',
          [playbook.id]
        );
        
        playbook.entriesCount = count.count;
      }
      
      return playbooks;
    } catch (error) {
      console.error('Error getting all playbooks:', error);
      throw error;
    }
  }
  
  // Update a playbook
  async update(id, playbookData) {
    try {
      const playbook = await this.getById(id);
      
      if (!playbook) {
        throw new Error(`Playbook with ID ${id} not found`);
      }
      
      // Update playbook data if provided
      if (playbookData.name || playbookData.instrument_id) {
        const sql = `
          UPDATE playbooks SET
            name = COALESCE(?, name),
            instrument_id = COALESCE(?, instrument_id)
          WHERE id = ?
        `;
        
        const params = [
          playbookData.name,
          playbookData.instrument_id,
          id
        ];
        
        await db.run(sql, params);
      }
      
      // Update entries if provided
      if (playbookData.entries) {
        await this.updateEntries(id, playbookData.entries);
      }
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating playbook:', error);
      throw error;
    }
  }
  
  // Update entries for a playbook
  async updateEntries(playbookId, entries) {
    try {
      // Start a transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Delete existing entries
        await db.run('DELETE FROM playbook_entries WHERE playbook_id = ?', [playbookId]);
        
        // Insert new entries
        for (const entry of entries) {
          const sql = `
            INSERT INTO playbook_entries (
              playbook_id,
              day,
              direction,
              confirmation_time,
              mode_time_start,
              mode_time_end,
              time_cl_1_start,
              time_cl_1_end,
              ret_median_time,
              dropoff_time,
              ret_cluster_1_start,
              ret_cluster_1_end,
              ret_cluster_2_start,
              ret_cluster_2_end,
              ret_cluster_3_start,
              ret_cluster_3_end,
              ext_median_time,
              ext_cluster_1_start,
              ext_cluster_1_end,
              ext_cluster_2_start,
              ext_cluster_2_end
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          const params = [
            playbookId,
            entry.day,
            entry.direction,
            entry.confirmation_time,
            entry.mode_time_start,
            entry.mode_time_end,
            entry.time_cl_1_start,
            entry.time_cl_1_end,
            entry.ret_median_time,
            entry.dropoff_time,
            entry.ret_cluster_1_start,
            entry.ret_cluster_1_end,
            entry.ret_cluster_2_start,
            entry.ret_cluster_2_end,
            entry.ret_cluster_3_start,
            entry.ret_cluster_3_end,
            entry.ext_median_time,
            entry.ext_cluster_1_start,
            entry.ext_cluster_1_end,
            entry.ext_cluster_2_start,
            entry.ext_cluster_2_end
          ];
          
          await db.run(sql, params);
        }
        
        // Commit the transaction
        await db.run('COMMIT');
      } catch (error) {
        // Rollback the transaction on error
        await db.run('ROLLBACK');
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating playbook entries:', error);
      throw error;
    }
  }
  
  // Delete a playbook
  async delete(id) {
    try {
      // Start a transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Delete playbook entries
        await db.run('DELETE FROM playbook_entries WHERE playbook_id = ?', [id]);
        
        // Delete the playbook
        await db.run('DELETE FROM playbooks WHERE id = ?', [id]);
        
        // Commit the transaction
        await db.run('COMMIT');
      } catch (error) {
        // Rollback the transaction on error
        await db.run('ROLLBACK');
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting playbook:', error);
      throw error;
    }
  }
}

module.exports = new PlaybookModel();