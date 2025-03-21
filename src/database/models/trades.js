// src/database/models/trades.js
const db = require('../db');

// Trade model for handling trade data operations
class TradeModel {
  // Create a new trade
  async create(tradeData) {
    try {
      // Calculate day from date
      const date = new Date(tradeData.date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = days[date.getDay()];
      
      // Calculate stop_ticks, pot_result, and average
      const stopTicks = Math.abs(tradeData.entry - tradeData.stop) / (await this.getTickValue(tradeData.instrument_id));
      const potResult = Math.abs(tradeData.target - tradeData.entry) / Math.abs(tradeData.entry - tradeData.stop);
      
      // Calculate result if exit price is provided
      let result = null;
      if (tradeData.exit) {
        result = (tradeData.exit - tradeData.entry) / Math.abs(tradeData.entry - tradeData.stop);
      }
      
      // Calculate average score if all scores are provided
      let average = null;
      if (
        tradeData.preparation &&
        tradeData.entry_score &&
        tradeData.stop_loss &&
        tradeData.target_score &&
        tradeData.management &&
        tradeData.rules
      ) {
        average = (
          tradeData.preparation +
          tradeData.entry_score +
          tradeData.stop_loss +
          tradeData.target_score +
          tradeData.management +
          tradeData.rules
        ) / 6;
      }
      
      // Insert the trade
      const sql = `
        INSERT INTO trades (
          date, day, confirmation_time, entry_time, instrument_id, confirmation_type,
          direction, session, entry_method_id, stopped_out, status, ret_entry,
          sd_exit, entry, stop, target, exit, stop_ticks, pot_result, result,
          preparation, entry_score, stop_loss, target_score, management, rules,
          average, planned_executed, account_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        tradeData.date,
        day,
        tradeData.confirmation_time,
        tradeData.entry_time,
        tradeData.instrument_id,
        tradeData.confirmation_type,
        tradeData.direction,
        tradeData.session,
        tradeData.entry_method_id,
        tradeData.stopped_out ? 1 : 0,
        tradeData.status,
        tradeData.ret_entry,
        tradeData.sd_exit,
        tradeData.entry,
        tradeData.stop,
        tradeData.target,
        tradeData.exit,
        stopTicks,
        potResult,
        result,
        tradeData.preparation,
        tradeData.entry_score,
        tradeData.stop_loss,
        tradeData.target_score,
        tradeData.management,
        tradeData.rules,
        average,
        tradeData.planned_executed || 'Planned',
        tradeData.account_id
      ];
      
      const { id } = await db.run(sql, params);
      
      // If documentation is provided, save it
      if (tradeData.trade_journal || tradeData.body_mind_state) {
        await this.saveDocumentation(id, {
          trade_journal: tradeData.trade_journal,
          body_mind_state: tradeData.body_mind_state
        });
      }
      
      // If confluences are provided, save them
      if (tradeData.confluences && tradeData.confluences.length > 0) {
        await this.saveConfluences(id, tradeData.confluences);
      }
      
      return { id, ...tradeData };
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }
  
  // Get a trade by ID
  async getById(id) {
    try {
      const trade = await db.get('SELECT * FROM trades WHERE id = ?', [id]);
      
      if (!trade) {
        return null;
      }
      
      // Get documentation
      const documentation = await db.get(
        'SELECT * FROM trade_documentation WHERE trade_id = ?',
        [id]
      );
      
      // Get confluences
      const confluences = await db.all(
        `SELECT c.id, c.name
         FROM confluences c
         JOIN trade_confluences tc ON c.id = tc.confluence_id
         WHERE tc.trade_id = ?`,
        [id]
      );
      
      return {
        ...trade,
        documentation,
        confluences: confluences.map(c => ({ id: c.id, name: c.name }))
      };
    } catch (error) {
      console.error('Error getting trade:', error);
      throw error;
    }
  }
  
  // Get all trades
  async getAll(filters = {}) {
    try {
      let sql = `
        SELECT t.*, i.name as instrument_name, i.color as instrument_color,
               e.name as entry_method_name, e.color as entry_method_color,
               a.name as account_name, a.color as account_color
        FROM trades t
        LEFT JOIN instruments i ON t.instrument_id = i.id
        LEFT JOIN entry_methods e ON t.entry_method_id = e.id
        LEFT JOIN accounts a ON t.account_id = a.id
      `;
      
      const whereConditions = [];
      const params = [];
      
      // Apply filters if provided
      if (filters) {
        // Date range
        if (filters.date_from) {
          whereConditions.push('t.date >= ?');
          params.push(filters.date_from);
        }
        
        if (filters.date_to) {
          whereConditions.push('t.date <= ?');
          params.push(filters.date_to);
        }
        
        // Session
        if (filters.session) {
          whereConditions.push('t.session = ?');
          params.push(filters.session);
        }
        
        // Instrument
        if (filters.instrument_id) {
          whereConditions.push('t.instrument_id = ?');
          params.push(filters.instrument_id);
        }
        
        // Entry method
        if (filters.entry_method_id) {
          whereConditions.push('t.entry_method_id = ?');
          params.push(filters.entry_method_id);
        }
        
        // Account
        if (filters.account_id) {
          whereConditions.push('t.account_id = ?');
          params.push(filters.account_id);
        }
        
        // Average metrics range
        if (filters.average_metrics_from) {
          whereConditions.push('t.average >= ?');
          params.push(filters.average_metrics_from);
        }
        
        if (filters.average_metrics_to) {
          whereConditions.push('t.average <= ?');
          params.push(filters.average_metrics_to);
        }
        
        // Execution status
        if (filters.execution_status) {
          whereConditions.push('t.planned_executed = ?');
          params.push(filters.execution_status);
        }
        
        // Confirmation type
        if (filters.confirmation_type) {
          whereConditions.push('t.confirmation_type = ?');
          params.push(filters.confirmation_type);
        }
        
        // Direction
        if (filters.direction) {
          whereConditions.push('t.direction = ?');
          params.push(filters.direction);
        }
        
        // Status
        if (filters.status) {
          whereConditions.push('t.status = ?');
          params.push(filters.status);
        }
        
        // Days
        if (filters.days && filters.days.length > 0) {
          whereConditions.push(`t.day IN (${filters.days.map(() => '?').join(', ')})`);
          params.push(...filters.days);
        }
        
        // Stop ticks range
        if (filters.stop_ticks_from) {
          whereConditions.push('t.stop_ticks >= ?');
          params.push(filters.stop_ticks_from);
        }
        
        if (filters.stop_ticks_to) {
          whereConditions.push('t.stop_ticks <= ?');
          params.push(filters.stop_ticks_to);
        }
        
        // Confluences
        if (filters.confluences && filters.confluences.length > 0) {
          if (filters.confluences_logic === 'AND') {
            // All specified confluences must be present
            for (const confluenceId of filters.confluences) {
              const subQuery = `
                EXISTS (
                  SELECT 1 FROM trade_confluences tc
                  WHERE tc.trade_id = t.id AND tc.confluence_id = ?
                )
              `;
              whereConditions.push(subQuery);
              params.push(confluenceId);
            }
          } else {
            // At least one of the specified confluences must be present
            const subQuery = `
              EXISTS (
                SELECT 1 FROM trade_confluences tc
                WHERE tc.trade_id = t.id AND tc.confluence_id IN (${filters.confluences.map(() => '?').join(', ')})
              )
            `;
            whereConditions.push(subQuery);
            params.push(...filters.confluences);
          }
        }
      }
      
      // Add WHERE clause if conditions exist
      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      // Add ORDER BY clause
      sql += ' ORDER BY t.date DESC, t.confirmation_time DESC';
      
      const trades = await db.all(sql, params);
      
      // Get documentation and confluences for each trade
      const tradesWithDetails = await Promise.all(
        trades.map(async (trade) => {
          const documentation = await db.get(
            'SELECT * FROM trade_documentation WHERE trade_id = ?',
            [trade.id]
          );
          
          const confluences = await db.all(
            `SELECT c.id, c.name
             FROM confluences c
             JOIN trade_confluences tc ON c.id = tc.confluence_id
             WHERE tc.trade_id = ?`,
            [trade.id]
          );
          
          return {
            ...trade,
            documentation: documentation || {},
            confluences: confluences.map(c => ({ id: c.id, name: c.name }))
          };
        })
      );
      
      return tradesWithDetails;
    } catch (error) {
      console.error('Error getting all trades:', error);
      throw error;
    }
  }
  
  // Update a trade
  async update(id, tradeData) {
    try {
      // Get current trade data
      const currentTrade = await this.getById(id);
      
      if (!currentTrade) {
        throw new Error(`Trade with ID ${id} not found`);
      }
      
      // Calculate day from date if date changed
      let day = currentTrade.day;
      if (tradeData.date && tradeData.date !== currentTrade.date) {
        const date = new Date(tradeData.date);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        day = days[date.getDay()];
      }
      
      // Recalculate metrics if needed
      const entry = tradeData.entry || currentTrade.entry;
      const stop = tradeData.stop || currentTrade.stop;
      const target = tradeData.target || currentTrade.target;
      const exit = tradeData.exit || currentTrade.exit;
      
      const instrumentId = tradeData.instrument_id || currentTrade.instrument_id;
      const tickValue = await this.getTickValue(instrumentId);
      
      const stopTicks = Math.abs(entry - stop) / tickValue;
      const potResult = Math.abs(target - entry) / Math.abs(entry - stop);
      
      let result = null;
      if (exit) {
        result = (exit - entry) / Math.abs(entry - stop);
      }
      
      // Calculate average score if all scores are provided
      const preparation = tradeData.preparation !== undefined ? tradeData.preparation : currentTrade.preparation;
      const entryScore = tradeData.entry_score !== undefined ? tradeData.entry_score : currentTrade.entry_score;
      const stopLoss = tradeData.stop_loss !== undefined ? tradeData.stop_loss : currentTrade.stop_loss;
      const targetScore = tradeData.target_score !== undefined ? tradeData.target_score : currentTrade.target_score;
      const management = tradeData.management !== undefined ? tradeData.management : currentTrade.management;
      const rules = tradeData.rules !== undefined ? tradeData.rules : currentTrade.rules;
      
      let average = null;
      if (
        preparation &&
        entryScore &&
        stopLoss &&
        targetScore &&
        management &&
        rules
      ) {
        average = (
          preparation +
          entryScore +
          stopLoss +
          targetScore +
          management +
          rules
        ) / 6;
      }
      
      // Update the trade
      const sql = `
        UPDATE trades SET
          date = COALESCE(?, date),
          day = ?,
          confirmation_time = COALESCE(?, confirmation_time),
          entry_time = COALESCE(?, entry_time),
          instrument_id = COALESCE(?, instrument_id),
          confirmation_type = COALESCE(?, confirmation_type),
          direction = COALESCE(?, direction),
          session = COALESCE(?, session),
          entry_method_id = COALESCE(?, entry_method_id),
          stopped_out = COALESCE(?, stopped_out),
          status = COALESCE(?, status),
          ret_entry = COALESCE(?, ret_entry),
          sd_exit = COALESCE(?, sd_exit),
          entry = COALESCE(?, entry),
          stop = COALESCE(?, stop),
          target = COALESCE(?, target),
          exit = ?,
          stop_ticks = ?,
          pot_result = ?,
          result = ?,
          preparation = COALESCE(?, preparation),
          entry_score = COALESCE(?, entry_score),
          stop_loss = COALESCE(?, stop_loss),
          target_score = COALESCE(?, target_score),
          management = COALESCE(?, management),
          rules = COALESCE(?, rules),
          average = ?,
          planned_executed = COALESCE(?, planned_executed),
          account_id = COALESCE(?, account_id)
        WHERE id = ?
      `;
      
      const params = [
        tradeData.date,
        day,
        tradeData.confirmation_time,
        tradeData.entry_time,
        tradeData.instrument_id,
        tradeData.confirmation_type,
        tradeData.direction,
        tradeData.session,
        tradeData.entry_method_id,
        tradeData.stopped_out !== undefined ? (tradeData.stopped_out ? 1 : 0) : currentTrade.stopped_out,
        tradeData.status,
        tradeData.ret_entry,
        tradeData.sd_exit,
        entry,
        stop,
        target,
        exit,
        stopTicks,
        potResult,
        result,
        preparation,
        entryScore,
        stopLoss,
        targetScore,
        management,
        rules,
        average,
        tradeData.planned_executed,
        tradeData.account_id,
        id
      ];
      
      await db.run(sql, params);
      
      // Update documentation if provided
      if (tradeData.trade_journal !== undefined || tradeData.body_mind_state !== undefined) {
        await this.updateDocumentation(id, {
          trade_journal: tradeData.trade_journal,
          body_mind_state: tradeData.body_mind_state
        });
      }
      
      // Update confluences if provided
      if (tradeData.confluences !== undefined) {
        await this.updateConfluences(id, tradeData.confluences);
      }
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating trade:', error);
      throw error;
    }
  }
  
  // Delete a trade
  async delete(id) {
    try {
      // Delete trade documentation
      await db.run('DELETE FROM trade_documentation WHERE trade_id = ?', [id]);
      
      // Delete trade confluences
      await db.run('DELETE FROM trade_confluences WHERE trade_id = ?', [id]);
      
      // Delete the trade
      await db.run('DELETE FROM trades WHERE id = ?', [id]);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
  }
  
  // Save documentation for a trade
  async saveDocumentation(tradeId, documentationData) {
    try {
      // Check if documentation already exists
      const existingDoc = await db.get(
        'SELECT * FROM trade_documentation WHERE trade_id = ?',
        [tradeId]
      );
      
      if (existingDoc) {
        // Update existing documentation
        await db.run(
          `UPDATE trade_documentation SET
            trade_journal = COALESCE(?, trade_journal),
            body_mind_state = COALESCE(?, body_mind_state)
           WHERE trade_id = ?`,
          [
            documentationData.trade_journal,
            documentationData.body_mind_state,
            tradeId
          ]
        );
      } else {
        // Insert new documentation
        await db.run(
          `INSERT INTO trade_documentation (
            trade_id, trade_journal, body_mind_state
          ) VALUES (?, ?, ?)`,
          [
            tradeId,
            documentationData.trade_journal,
            documentationData.body_mind_state
          ]
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving trade documentation:', error);
      throw error;
    }
  }
  
  // Update documentation for a trade
  async updateDocumentation(tradeId, documentationData) {
    return this.saveDocumentation(tradeId, documentationData);
  }
  
  // Save confluences for a trade
  async saveConfluences(tradeId, confluenceIds) {
    try {
      // First delete existing confluences for this trade
      await db.run('DELETE FROM trade_confluences WHERE trade_id = ?', [tradeId]);
      
      // Then insert new confluences
      for (const confluenceId of confluenceIds) {
        await db.run(
          'INSERT INTO trade_confluences (trade_id, confluence_id) VALUES (?, ?)',
          [tradeId, confluenceId]
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving trade confluences:', error);
      throw error;
    }
  }
  
  // Update confluences for a trade
  async updateConfluences(tradeId, confluenceIds) {
    return this.saveConfluences(tradeId, confluenceIds);
  }
  
  // Get tick value for an instrument
  async getTickValue(instrumentId) {
    try {
      const instrument = await db.get(
        'SELECT tick_value FROM instruments WHERE id = ?',
        [instrumentId]
      );
      
      if (!instrument) {
        throw new Error(`Instrument with ID ${instrumentId} not found`);
      }
      
      return instrument.tick_value;
    } catch (error) {
      console.error('Error getting instrument tick value:', error);
      throw error;
    }
  }
  
  // Get KPIs for dashboard
  async getKPIs() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      
      // Get all trades
      const allTrades = await db.all('SELECT * FROM trades');
      
      // Get trades from the last 7 days
      const recentTrades = await db.all(
        'SELECT * FROM trades WHERE date >= ?',
        [sevenDaysAgoStr]
      );
      
      // Calculate KPIs
      const totalTrades = allTrades.length;
      const totalR = allTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
      
      const winners = allTrades.filter(trade => trade.status === 'Winner').length;
      const recentWinners = recentTrades.filter(trade => trade.status === 'Winner').length;
      
      const expenses = allTrades.filter(trade => trade.status === 'Expense').length;
      const recentExpenses = recentTrades.filter(trade => trade.status === 'Expense').length;
      
      const breakEvens = allTrades.filter(
        trade => trade.result !== null && Math.abs(trade.result) < 0.1
      ).length;
      const recentBreakEvens = recentTrades.filter(
        trade => trade.result !== null && Math.abs(trade.result) < 0.1
      ).length;
      
      const chickenOuts = allTrades.filter(
        trade => trade.exit && trade.exit < trade.target && !trade.stopped_out
      );
      const chickenOutCount = chickenOuts.length;
      const missedR = chickenOuts.reduce(
        (sum, trade) => sum + ((trade.target - trade.exit) / Math.abs(trade.entry - trade.stop)),
        0
      );
      
      const winRate = totalTrades > 0 ? (winners / totalTrades) * 100 : 0;
      
      const winningTrades = allTrades.filter(trade => trade.status === 'Winner');
      const averageWin = winningTrades.length > 0
        ? winningTrades.reduce((sum, trade) => sum + (trade.result || 0), 0) / winningTrades.length
        : 0;
      
      const tradesWithMetrics = allTrades.filter(trade => trade.average !== null);
      const averageMetricsScore = tradesWithMetrics.length > 0
        ? tradesWithMetrics.reduce((sum, trade) => sum + trade.average, 0) / tradesWithMetrics.length
        : 0;
      
      return {
        totalTrades,
        totalR,
        winners,
        recentWinners,
        expenses,
        recentExpenses,
        breakEvens,
        recentBreakEvens,
        chickenOutCount,
        missedR,
        winRate,
        winRateBasedOn: totalTrades,
        averageWin,
        averageMetricsScore,
        metricsBasedOn: tradesWithMetrics.length
      };
    } catch (error) {
      console.error('Error getting KPIs:', error);
      throw error;
    }
  }
  
  // Get weekly metrics for dashboard chart
  async getWeeklyMetrics() {
    try {
      // Get all trades with metrics
      const tradesWithMetrics = await db.all(
        'SELECT date, average FROM trades WHERE average IS NOT NULL ORDER BY date'
      );
      
      // Group trades by week
      const weeklyMetrics = tradesWithMetrics.reduce((acc, trade) => {
        const date = new Date(trade.date);
        const year = date.getFullYear();
        const weekNumber = this.getWeekNumber(date);
        const weekKey = `${year}-W${weekNumber}`;
        
        if (!acc[weekKey]) {
          acc[weekKey] = {
            week: weekKey,
            sum: 0,
            count: 0,
            average: 0
          };
        }
        
        acc[weekKey].sum += trade.average;
        acc[weekKey].count += 1;
        acc[weekKey].average = acc[weekKey].sum / acc[weekKey].count;
        
        return acc;
      }, {});
      
      // Convert to array and sort by week
      return Object.values(weeklyMetrics).sort((a, b) => a.week.localeCompare(b.week));
    } catch (error) {
      console.error('Error getting weekly metrics:', error);
      throw error;
    }
  }
  
  // Helper function to get week number
  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
}

module.exports = new TradeModel();
