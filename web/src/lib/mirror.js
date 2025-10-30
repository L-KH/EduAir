const MIRROR_URL = import.meta.env.VITE_MIRROR_URL || 'https://testnet.mirrornode.hedera.com';

export async function fetchMessages(topicId, limit = 50) {
  const url = `${MIRROR_URL}/api/v1/topics/${topicId}/messages?limit=${limit}&order=desc`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mirror Node error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return data.messages.map(msg => {
    try {
      const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      return parsed;
    } catch (e) {
      console.warn('Failed to parse message:', e);
      return { deviceId: 'unknown', sensors: {}, ts: Date.now() };
    }
  });
}
