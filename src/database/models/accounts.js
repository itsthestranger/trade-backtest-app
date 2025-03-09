// src/database/models/accounts.js
const db = require('../db');

// Account model for handling account data operations
class AccountModel {
  // Create a new account
  async create(accountData) {
    try {
      // Check if account with this name already exists
      const existingAccount = await db.get(
        'SELECT * FROM accounts WHERE name = ?',
        [accountData.name]
      );
      
      if (existingAccount) {
        throw new Error(`Account with name '${accountData.name}' already exists`);
      }
      
      // Insert the account
      const sql = `
        INSERT INTO accounts (
          name,
          size,
          risk_per_r,
          color
        ) VALUES (?, ?, ?, ?)
      `;
      
      const params = [
        accountData.name,
        accountData.size,
        accountData.risk_per_r,
        accountData.color || '#1976d2'
      ];
      
      const { id } = await db.run(sql, params);
      
      return { id, ...accountData };
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }
  
  // Get an account by ID
  async getById(id) {
    try {
      const account = await db.get('SELECT * FROM accounts WHERE id = ?', [id]);
      
      if (!account) {
        return null;
      }
      
      return account;
    } catch (error) {
      console.error('Error getting account:', error);
      throw error;
    }
  }
  
  // Get all accounts
  async getAll() {
    try {
      const accounts = await db.all('SELECT * FROM accounts ORDER BY name');
      return accounts;
    } catch (error) {
      console.error('Error getting all accounts:', error);
      throw error;
    }
  }
  
  // Update an account
  async update(id, accountData) {
    try {
      // Check if account exists
      const existingAccount = await this.getById(id);
      
      if (!existingAccount) {
        throw new Error(`Account with ID ${id} not found`);
      }
      
      // Check if update would create a duplicate name
      if (accountData.name) {
        const duplicateCheck = await db.get(
          'SELECT * FROM accounts WHERE name = ? AND id != ?',
          [accountData.name, id]
        );
        
        if (duplicateCheck) {
          throw new Error(`Account with name '${accountData.name}' already exists`);
        }
      }
      
      // Update the account
      const sql = `
        UPDATE accounts SET
          name = COALESCE(?, name),
          size = COALESCE(?, size),
          risk_per_r = COALESCE(?, risk_per_r),
          color = COALESCE(?, color)
        WHERE id = ?
      `;
      
      const params = [
        accountData.name,
        accountData.size,
        accountData.risk_per_r,
        accountData.color,
        id
      ];
      
      await db.run(sql, params);
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }
  
  // Delete an account
  async delete(id) {
    try {
      // Check if account is used in any trades
      const tradeCheck = await db.get(
        'SELECT COUNT(*) as count FROM trades WHERE account_id = ?',
        [id]
      );
      
      if (tradeCheck.count > 0) {
        throw new Error(`Cannot delete account: it is used in ${tradeCheck.count} trades`);
      }
      
      // Delete the account
      await db.run('DELETE FROM accounts WHERE id = ?', [id]);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
}

module.exports = new AccountModel();