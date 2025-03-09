// src/database/models/entryMethods.js
const db = require('../db');

// Entry Method model for handling entry method data operations
class EntryMethodModel {
  // Create a new entry method
  async create(entryMethodData) {
    try {
      // Check if entry method with this name already exists
      const existingEntryMethod = await db.get(
        'SELECT * FROM entry_methods WHERE name = ?',
        [entryMethodData.name]
      );
      
      if (existingEntryMethod) {
        throw new Error(`Entry method with name '${entryMethodData.name}' already exists`);
      }
      
      // Insert the entry method
      const sql = `
        INSERT INTO entry_methods (
          name,
          description,
          color
        ) VALUES (?, ?, ?)
      `;
      
      const params = [
        entryMethodData.name,
        entryMethodData.description || '',
        entryMethodData.color || '#1976d2'
      ];
      
      const { id } = await db.run(sql, params);
      
      return { id, ...entryMethodData };
    } catch (error) {
      console.error('Error creating entry method:', error);
      throw error;
    }
  }
  
  // Get an entry method by ID
  async getById(id) {
    try {
      const entryMethod = await db.get('SELECT * FROM entry_methods WHERE id = ?', [id]);
      
      if (!entryMethod) {
        return null;
      }
      
      return entryMethod;
    } catch (error) {
      console.error('Error getting entry method:', error);
      throw error;
    }
  }
  
  // Get all entry methods
  async getAll() {
    try {
      const entryMethods = await db.all('SELECT * FROM entry_methods ORDER BY name');
      return entryMethods;
    } catch (error) {
      console.error('Error getting all entry methods:', error);
      throw error;
    }
  }
  
  // Update an entry method
  async update(id, entryMethodData) {
    try {
      // Check if entry method exists
      const existingEntryMethod = await this.getById(id);
      
      if (!existingEntryMethod) {
        throw new Error(`Entry method with ID ${id} not found`);
      }
      
      // Check if update would create a duplicate name
      if (entryMethodData.name) {
        const duplicateCheck = await db.get(
          'SELECT * FROM entry_methods WHERE name = ? AND id != ?',
          [entryMethodData.name, id]
        );
        
        if (duplicateCheck) {
          throw new Error(`Entry method with name '${entryMethodData.name}' already exists`);
        }
      }
      
      // Update the entry method
      const sql = `
        UPDATE entry_methods SET
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          color = COALESCE(?, color)
        WHERE id = ?
      `;
      
      const params = [
        entryMethodData.name,
        entryMethodData.description,
        entryMethodData.color,
        id
      ];
      
      await db.run(sql, params);
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating entry method:', error);
      throw error;
    }
  }
  
  // Delete an entry method
  async delete(id) {
    try {
      // Check if entry method is used in any trades
      const tradeCheck = await db.get(
        'SELECT COUNT(*) as count FROM trades WHERE entry_method_id = ?',
        [id]
      );
      
      if (tradeCheck.count > 0) {
        throw new Error(`Cannot delete entry method: it is used in ${tradeCheck.count} trades`);
      }
      
      // Delete the entry method
      await db.run('DELETE FROM entry_methods WHERE id = ?', [id]);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting entry method:', error);
      throw error;
    }
  }
}

module.exports = new EntryMethodModel();