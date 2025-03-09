// src/utils/calculations.js

/**
 * Calculate stop ticks based on entry price, stop price, and tick value
 * @param {number} entry - Entry price
 * @param {number} stop - Stop price
 * @param {number} tickValue - Tick value of the instrument
 * @returns {number} - Stop ticks
 */
const calculateStopTicks = (entry, stop, tickValue) => {
    if (!entry || !stop || !tickValue) return 0;
    return Math.abs(entry - stop) / tickValue;
  };
  
  /**
   * Calculate potential R (risk to reward ratio)
   * @param {number} entry - Entry price
   * @param {number} stop - Stop price
   * @param {number} target - Target price
   * @returns {number} - Potential R
   */
  const calculatePotentialR = (entry, stop, target) => {
    if (!entry || !stop || !target) return 0;
    const risk = Math.abs(entry - stop);
    if (risk === 0) return 0;
    return Math.abs(target - entry) / risk;
  };
  
  /**
   * Calculate actual R result
   * @param {number} entry - Entry price
   * @param {number} stop - Stop price
   * @param {number} exit - Exit price
   * @returns {number} - Result in R
   */
  const calculateResult = (entry, stop, exit) => {
    if (!entry || !stop || !exit) return null;
    const risk = Math.abs(entry - stop);
    if (risk === 0) return 0;
    return (exit - entry) / risk;
  };
  
  /**
   * Calculate average score from trade metrics
   * @param {number} preparation - Preparation score (1-10)
   * @param {number} entryScore - Entry score (1-10)
   * @param {number} stopLoss - Stop loss score (1-10)
   * @param {number} targetScore - Target score (1-10)
   * @param {number} management - Management score (1-10)
   * @param {number} rules - Rules score (1-10)
   * @returns {number} - Average score
   */
  const calculateAverageScore = (preparation, entryScore, stopLoss, targetScore, management, rules) => {
    const scores = [preparation, entryScore, stopLoss, targetScore, management, rules].filter(score => score !== null && score !== undefined);
    
    if (scores.length === 0) return null;
    
    const sum = scores.reduce((total, score) => total + score, 0);
    return sum / scores.length;
  };
  
  /**
   * Calculate win rate
   * @param {Array} trades - Array of trades
   * @returns {number} - Win rate percentage
   */
  const calculateWinRate = (trades) => {
    if (!trades || trades.length === 0) return 0;
    
    const winners = trades.filter(trade => trade.status === 'Winner').length;
    return (winners / trades.length) * 100;
  };
  
  /**
   * Calculate total R
   * @param {Array} trades - Array of trades
   * @returns {number} - Total R
   */
  const calculateTotalR = (trades) => {
    if (!trades || trades.length === 0) return 0;
    
    return trades.reduce((sum, trade) => sum + (trade.result || 0), 0);
  };
  
  /**
   * Calculate position size
   * @param {number} accountSize - Account size
   * @param {number} riskPercent - Risk percentage
   * @param {number} stopTicks - Stop ticks
   * @param {number} tickValue - Tick value
   * @returns {number} - Number of contracts to buy
   */
  const calculatePositionSize = (accountSize, riskPercent, stopTicks, tickValue) => {
    if (!accountSize || !riskPercent || !stopTicks || !tickValue) return 0;
    
    const riskAmount = accountSize * (riskPercent / 100);
    const contractRisk = stopTicks * tickValue;
    
    if (contractRisk === 0) return 0;
    
    return Math.floor(riskAmount / contractRisk);
  };
  
  /**
   * Determine if a trade is a "chicken out" (exit < target and not stopped out)
   * @param {number} exit - Exit price
   * @param {number} target - Target price
   * @param {boolean} stoppedOut - Whether the trade was stopped out
   * @returns {boolean} - Whether it's a chicken out
   */
  const isChickenOut = (exit, target, stoppedOut) => {
    if (!exit || !target) return false;
    return exit < target && !stoppedOut;
  };
  
  /**
   * Calculate missed R from chicken out trades
   * @param {Array} trades - Array of trades
   * @returns {number} - Total missed R
   */
  const calculateMissedR = (trades) => {
    if (!trades || trades.length === 0) return 0;
    
    const chickenOuts = trades.filter(trade => 
      trade.exit && trade.target && trade.exit < trade.target && !trade.stopped_out
    );
    
    return chickenOuts.reduce((sum, trade) => {
      const missedR = (trade.target - trade.exit) / Math.abs(trade.entry - trade.stop);
      return sum + missedR;
    }, 0);
  };
  
  module.exports = {
    calculateStopTicks,
    calculatePotentialR,
    calculateResult,
    calculateAverageScore,
    calculateWinRate,
    calculateTotalR,
    calculatePositionSize,
    isChickenOut,
    calculateMissedR
  };