import crypto from 'crypto';

/**
 * Generate SHA256 hash in hex format
 * @param {string} data - Data to hash
 * @returns {string} Hex string (64 chars)
 */
export function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate HMAC-SHA256 in hex format
 * @param {string} secret - Secret key
 * @param {string} data - Data to sign
 * @returns {string} Hex string (64 chars)
 */
export function hmacSha256Hex(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Compute privacy-preserving UID hash
 * @param {string} uidHex - NFC card UID in hex (e.g., "04AABBCCDD")
 * @param {string} sessionSalt - Session-specific salt
 * @returns {string} Hashed UID with 0x prefix
 */
export function computeUidHash(uidHex, sessionSalt) {
  const combined = uidHex + sessionSalt;
  const hash = sha256Hex(combined);
  return '0x' + hash;
}

/**
 * Derive deterministic session salt
 * @param {string} secret - SALT_SECRET from env
 * @param {string} classId - Class identifier (e.g., "math-9a")
 * @param {string} sessionStartIso - ISO timestamp of session start
 * @returns {string} Hex session salt
 */
export function deriveSessionSalt(secret, classId, sessionStartIso) {
  const data = `${classId}:${sessionStartIso}`;
  return hmacSha256Hex(secret, data);
}
