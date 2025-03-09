// src/database/models/filters.js
const db = require('../db');

// Filter model for handling filter data operations
class FilterModel {
  // Create a new filter
  async create(filterData) {
    try {
      // Check if filter with this name already exists
      const existingFilter = await db.get(
        'SELECT * FROM filters WHERE name = ?',
        [filterData.name]
      );
      
      if (existingFilter) {
        throw new Error(`Filter with name '${filterData.name}' already exists`);
      }
      
      // Start a transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Insert the filter
        const sql = `
          INSERT INTO filters (
            name,
            date_from,
            date_to,
            session,
            instrument_id,
            entry_method_id,
            account_id,
            average_metrics_from,
            average_metrics_to,
            confluences_logic,
            execution_status,
            confirmation_type,
            direction,
            status,
            days,
            stop_ticks_from,
            stop_ticks_to
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Convert days array to comma-separated string if it's an array
        const daysStr = Array.isArray(filterData.days) ? filterData.days.join(',') : filterData.days;
        
        const params = [
          filterData.name,
          filterData.date_from,
          filterData.date_to,
          filterData.session,
          filterData.instrument_id,
          filterData.entry_method_id,
          filterData.account_id,
          filterData.average_metrics_from,
          filterData.average_metrics_to,
          filterData.confluences_logic || 'AND',
          filterData.execution_status,
          filterData.confirmation_type,
          filterData.direction,
          filterData.status,
          daysStr,
          filterData.stop_ticks_from,
          filterData.stop_ticks_to
        ];
        
        const { id } = await db.run(sql, params);
        
        // If confluences are provided, save them
        if (filterData.confluences && filterData.confluences.length > 0) {
          await this.saveConfluences(id, filterData.confluences);
        }
        
        // Commit the transaction
        await db.run('COMMIT');
        
        return await this.getById(id);
      } catch (error) {
        // Rollback the transaction on error
        await db.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error creating filter:', error);
      throw error;
    }
  }
  
  // Get a filter by ID
  async getById(id) {
    try {
      const filter = await db.get('SELECT * FROM filters WHERE id = ?', [id]);
      
      if (!filter) {
        return null;
      }
      
      // Convert days string to array if it exists
      if (filter.days) {
        filter.days = filter.days.split(',');
      } else {
        filter.days = [];
      }
      
      // Get confluences
      const confluences = await db.all(
        `SELECT confluence_id FROM filter_confluences WHERE filter_id = ?`,
        [id]
      );
      
      filter.confluences = confluences.map(c => c.confluence_id);
      
      return filter;
    } catch (error) {
      console.error('Error getting filter:', error);
      throw error;
    }
  }
  
  // Get all filters
  async getAll() {
    try {
      const filters = await db.all('SELECT * FROM filters ORDER BY name');
      
      // Process each filter
      for (const filter of filters) {
        // Convert days string to array if it exists
        if (filter.days) {
          filter.days = filter.days.split(',');
        } else {
          filter.days = [];
        }
        
        // Get confluences
        const confluences = await db.all(
          `SELECT confluence_id FROM filter_confluences WHERE filter_id = ?`,
          [filter.id]
        );
        
        filter.confluences = confluences.map(c => c.confluence_id);
      }
      
      return filters;
    } catch (error) {
      console.error('Error getting all filters:', error);
      throw error;
    }
  }
  
  // Update a filter
  async update(id, filterData) {
    try {
      // Check if filter exists
      const existingFilter = await this.getById(id);
      
      if (!existingFilter) {
        throw new Error(`Filter with ID ${id} not found`);
      }
      
      // Check if update would create a duplicate name
      if (filterData.name) {
        const duplicateCheck = await db.get(
          'SELECT * FROM filters WHERE name = ? AND id != ?',
          [filterData.name, id]
        );
        
        if (duplicateCheck) {
          throw new Error(`Filter with name '${filterData.name}' already exists`);
        }
      }
      
      // Start a transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Convert days array to comma-separated string if it's an array
        let daysStr = filterData.days;
        if (Array.isArray(filterData.days)) {
          daysStr = filterData.days.join(',');
        }
        
        // Update the filter
        const sql = `
          UPDATE filters SET
            name = COALESCE(?, name),
            date_from = ?,
            date_to = ?,
            session = ?,
            instrument_id = ?,
            entry_method_id = ?,
            account_id = ?,
            average_metrics_from = ?,
            average_metrics_to = ?,
            confluences_logic = COALESCE(?, confluences_logic),
            execution_status = ?,
            confirmation_type = ?,
            direction = ?,
            status = ?,
            days = ?,
            stop_ticks_from = ?,
            stop_ticks_to = ?
          WHERE id = ?
        `;
        
        const params = [
          filterData.name,
          filterData.date_from,
          filterData.date_to,
          filterData.session,
          filterData.instrument_id,
          filterData.entry_method_id,
          filterData.account_id,
          filterData.average_metrics_from,
          filterData.average_metrics_to,
          filterData.confluences_logic,
          filterData.execution_status,
          filterData.confirmation_type,
          filterData.direction,
          filterData.status,
          daysStr,
          filterData.stop_ticks_from,
          filterData.stop_ticks_to,
          id
        ];
        
        await db.run(sql, params);
        
        // If confluences are provided, update them
        if (filterData.confluences !== undefined) {
          await this.updateConfluences(id, filterData.confluences);
        }
        
        // Commit the transaction
        await db.run('COMMIT');
        
        return await this.getById(id);
      } catch (error) {
        // Rollback the transaction on error
        await db.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error updating filter:', error);
      throw error;
    }
  }
  
  // Delete a filter
  async delete(id) {
    try {
      // Start a transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Delete filter confluences
        await db.run('DELETE FROM filter_confluences WHERE filter_id = ?', [id]);
        
        // Delete the filter
        await db.run('DELETE FROM filters WHERE id = ?', [id]);
        
        // Commit the transaction
        await db.run('COMMIT');
        
        return { success: true };
      } catch (error) {
        // Rollback the transaction on error
        await db.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error deleting filter:', error);
      throw error;
    }
  }
  
  // Save confluences for a filter
  async saveConfluences(filterId, confluenceIds) {
    try {
      // First delete existing confluences for this filter
      await db.run('DELETE FROM filter_confluences WHERE filter_id = ?', [filterId]);
      
      // Then insert new confluences
      for (const confluenceId of confluenceIds) {
        await db.run(
          'INSERT INTO filter_confluences (filter_id, confluence_id) VALUES (?, ?)',
          [filterId, confluenceId]
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving filter confluences:', error);
      throw error;
    }
  }
  
  // Update confluences for a filter
  async updateConfluences(filterId, confluenceIds) {
    return this.saveConfluences(filterId, confluenceIds);
  }
}

module.exports = new FilterModel();