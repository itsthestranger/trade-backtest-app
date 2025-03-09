// src/utils/dateUtils.js
import { format, parse, addDays, subDays, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'yyyy-MM-dd');
};

/**
 * Format time to HH:mm
 * @param {string} time - Time to format
 * @returns {string} - Formatted time string
 */
export const formatTime = (time) => {
  if (!time) return '';
  
  // If already in the right format, return as is
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  
  try {
    return format(parse(time, 'HH:mm:ss', new Date()), 'HH:mm');
  } catch (error) {
    return time;
  }
};

/**
 * Get day of week (Mon, Tue, etc.) from date
 * @param {string|Date} date - Date to get day from
 * @returns {string} - Day of week
 */
export const getDayOfWeek = (date) => {
  if (!date) return '';
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = new Date(date).getDay();
  return days[dayIndex];
};

/**
 * Check if a date is within the last N days
 * @param {string|Date} date - Date to check
 * @param {number} days - Number of days
 * @returns {boolean} - Whether date is within the last N days
 */
export const isWithinLastDays = (date, days) => {
  if (!date) return false;
  
  const today = new Date();
  const startDate = subDays(today, days);
  const checkDate = new Date(date);
  
  return isWithinInterval(checkDate, { start: startDate, end: today });
};

/**
 * Get dates for the current week
 * @param {Date} [baseDate=new Date()] - Base date
 * @returns {Array} - Array of dates for the current week
 */
export const getCurrentWeekDates = (baseDate = new Date()) => {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 }); // Week starts on Monday
  const end = endOfWeek(baseDate, { weekStartsOn: 1 });
  
  return eachDayOfInterval({ start, end });
};

/**
 * Get week number from date (ISO week number)
 * @param {Date} date - Date to get week number from
 * @returns {number} - Week number
 */
export const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Thursday in current week
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  
  return weekNumber;
};

/**
 * Format date as Month YYYY (e.g., January 2023)
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatMonthYear = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMMM yyyy');
};

/**
 * Group dates by week
 * @param {Array} dates - Array of dates
 * @returns {Object} - Object with week numbers as keys and arrays of dates as values
 */
export const groupByWeek = (dates) => {
  return dates.reduce((acc, date) => {
    const weekNumber = getWeekNumber(new Date(date));
    const year = new Date(date).getFullYear();
    const key = `${year}-W${weekNumber}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    
    acc[key].push(date);
    return acc;
  }, {});
};

/**
 * Parse time string to date
 * @param {string} timeStr - Time string (HH:mm)
 * @param {Date} [baseDate=new Date()] - Base date
 * @returns {Date} - Date object with the specified time
 */
export const parseTime = (timeStr, baseDate = new Date()) => {
  if (!timeStr) return null;
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Calculate time difference in minutes
 * @param {string} time1 - First time (HH:mm)
 * @param {string} time2 - Second time (HH:mm)
 * @returns {number} - Difference in minutes
 */
export const getTimeDifferenceInMinutes = (time1, time2) => {
  if (!time1 || !time2) return 0;
  
  const date1 = parseTime(time1);
  const date2 = parseTime(time2);
  
  return Math.abs(date2 - date1) / (1000 * 60);
};

/**
 * Get array of times in 5-minute intervals between two times
 * @param {string} startTime - Start time (HH:mm)
 * @param {string} endTime - End time (HH:mm)
 * @returns {Array} - Array of time strings
 */
export const getTimesBetween = (startTime, endTime) => {
  if (!startTime || !endTime) return [];
  
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  if (start > end) return [];
  
  const times = [];
  let current = new Date(start);
  
  while (current <= end) {
    times.push(format(current, 'HH:mm'));
    current.setMinutes(current.getMinutes() + 5);
  }
  
  return times;
};

/**
 * Get next day's date
 * @param {string|Date} date - Base date
 * @returns {string} - Next day's date (YYYY-MM-DD)
 */
export const getNextDay = (date) => {
  if (!date) return '';
  
  const nextDay = addDays(new Date(date), 1);
  return formatDate(nextDay);
};

/**
 * Get previous day's date
 * @param {string|Date} date - Base date
 * @returns {string} - Previous day's date (YYYY-MM-DD)
 */
export const getPreviousDay = (date) => {
  if (!date) return '';
  
  const prevDay = subDays(new Date(date), 1);
  return formatDate(prevDay);
};