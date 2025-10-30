/**
 * Topic resolution utilities
 * Supports dedicated topics or fallback to single topic
 */

/**
 * Resolve topic ID by message type
 * @param {string} type - Message type: "attendance" | "telemetry"
 * @returns {string} Topic ID to use
 */
export function resolveTopicIdByType(type) {
  const {
    TOPIC_ID_ATTENDANCE,
    TOPIC_ID_TELEMETRY,
    TOPIC_ID
  } = process.env;

  if (type === 'attendance') {
    return TOPIC_ID_ATTENDANCE || TOPIC_ID;
  }
  
  if (type === 'telemetry') {
    return TOPIC_ID_TELEMETRY || TOPIC_ID;
  }
  
  // Fallback
  return TOPIC_ID;
}

/**
 * Check if dedicated topics are configured
 * @returns {boolean}
 */
export function hasDedicatedTopics() {
  return !!(process.env.TOPIC_ID_ATTENDANCE && process.env.TOPIC_ID_TELEMETRY);
}

/**
 * Get all configured topic IDs
 * @returns {object} Topic configuration
 */
export function getTopicConfig() {
  return {
    attendance: process.env.TOPIC_ID_ATTENDANCE || process.env.TOPIC_ID || null,
    telemetry: process.env.TOPIC_ID_TELEMETRY || process.env.TOPIC_ID || null,
    fallback: process.env.TOPIC_ID || null,
    dedicated: hasDedicatedTopics()
  };
}
