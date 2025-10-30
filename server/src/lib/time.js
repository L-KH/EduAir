/**
 * Time utilities for session management
 */

/**
 * Check if timestamp is within tolerance of session start
 * @param {number} ts - Unix timestamp in milliseconds
 * @param {string} startIso - ISO 8601 session start time
 * @param {number} toleranceMinutes - Late tolerance in minutes
 * @returns {object} { onTime: boolean, minutesLate: number }
 */
export function withinTolerance(ts, startIso, toleranceMinutes) {
  const startTime = new Date(startIso).getTime();
  const diffMs = ts - startTime;
  const diffMinutes = diffMs / 60000;
  
  return {
    onTime: diffMinutes <= toleranceMinutes,
    minutesLate: Math.max(0, diffMinutes)
  };
}

/**
 * Determine attendance status based on timing
 * @param {number} ts - Event timestamp
 * @param {string} startIso - Session start ISO timestamp
 * @param {number} toleranceMinutes - Late tolerance
 * @returns {string} "present_on_time" | "late"
 */
export function determineStatus(ts, startIso, toleranceMinutes) {
  const { onTime } = withinTolerance(ts, startIso, toleranceMinutes);
  return onTime ? 'present_on_time' : 'late';
}

/**
 * Get current ISO timestamp
 * @returns {string} ISO 8601 timestamp
 */
export function nowIso() {
  return new Date().toISOString();
}

/**
 * Parse ISO timestamp to Date
 * @param {string} iso - ISO 8601 timestamp
 * @returns {Date}
 */
export function parseIso(iso) {
  return new Date(iso);
}

/**
 * Format timestamp for display
 * @param {number} ts - Unix timestamp in ms
 * @returns {string} Formatted time
 */
export function formatTimestamp(ts) {
  return new Date(ts).toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'medium'
  });
}
