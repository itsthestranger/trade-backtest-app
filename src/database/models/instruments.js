// src/database/models/instruments.js
const db = require('../db');

// Instrument model for handling instrument data operations
class InstrumentModel {
  // Create a new instrument
  async create(instrumentData) {
    try {
      // Check if instrument with this name already exists
      const existingInstrument = await db.get(
        'SELECT * FROM instruments WHERE name = ?',
        [instrumentData.name]
      );
      
      if (existingInstrument) {
        throw new Error(`Instrument with name '${instrumentData.name}' already exists`);
      }
      
      // Insert the instrument
      const sql = `
        INSERT INTO instruments (
          name,
          tick_value,
          color
        ) VALUES (?, ?, ?)
      `;
      
      const params = [
        instrumentData.name,
        instrumentData.tick_value,
        instrumentData.color || '#1976d2'
      ];
      
      const { id } = await db.run(sql, params);
      
      return { id, ...instrumentData };
    } catch (error) {
      console.error('Error creating instrument:', error);
      throw error;
    }
  }
  
  // Get an instrument by ID
  async getById(id) {
    try {
      const instrument = await db.get('SELECT * FROM instruments WHERE id = ?', [id]);
      
      if (!instrument) {
        return null;
      }
      
      return instrument;
    } catch (error) {
      console.error('Error getting instrument:', error);
      throw error;
    }
  }
  
  // Get all instruments
  async getAll() {
    try {
      const instruments = await db.all('SELECT * FROM instruments ORDER BY name');
      return instruments;
    } catch (error) {
      console.error('Error getting all instruments:', error);
      throw error;
    }
  }
  
  // Update an instrument
  async update(id, instrumentData) {
    try {
      // Check if instrument exists
      const existingInstrument = await this.getById(id);
      
      if (!existingInstrument) {
        throw new Error(`Instrument with ID ${id} not found`);
      }
      
      // Check if update would create a duplicate name
      if (instrumentData.name) {
        const duplicateCheck = await db.get(
          'SELECT * FROM instruments WHERE name = ? AND id != ?',
          [instrumentData.name, id]
        );
        
        if (duplicateCheck) {
          throw new Error(`Instrument with name '${instrumentData.name}' already exists`);
        }
      }
      
      // Update the instrument
      const sql = `
        UPDATE instruments SET
          name = COALESCE(?, name),
          tick_value = COALESCE(?, tick_value),
          color = COALESCE(?, color)
        WHERE id = ?
      `;
      
      const params = [
        instrumentData.name,
        instrumentData.tick_value,
        instrumentData.color,
        id
      ];
      
      await db.run(sql, params);
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating instrument:', error);
      throw error;
    }
  }
  
  // Delete an instrument
  async delete(id) {
    try {
      // Check if instrument is used in any trades
      const tradeCheck = await db.get(
        'SELECT COUNT(*) as count FROM trades WHERE instrument_id = ?',
        [id]
      );
      
      if (tradeCheck.count > 0) {
        throw new Error(`Cannot delete instrument: it is used in ${tradeCheck.count} trades`);
      }
      
      // Check if instrument is used in any playbooks
      const playbookCheck = await db.get(
        'SELECT COUNT(*) as count FROM playbooks WHERE instrument_id = ?',
        [id]
      );
      
      if (playbookCheck.count > 0) {
        throw new Error(`Cannot delete instrument: it is used in ${playbookCheck.count} playbooks`);
      }
      
      // Delete the instrument
      await db.run('DELETE FROM instruments WHERE id = ?', [id]);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting instrument:', error);
      throw error;
    }
  }
}

module.exports = new InstrumentModel();