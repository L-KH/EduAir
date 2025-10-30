import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:8787';

async function submitSample() {
  const payload = {
    deviceId: 'test-device-001',
    sensors: {
      temp: 22.5 + Math.random() * 5,
      hum: 40 + Math.random() * 20,
      pm25: 10 + Math.random() * 15
    },
    session: 'morning',
    attendance: ['alice', 'bob', 'charlie']
  };

  console.log('📤 Submitting sample telemetry...');
  console.log(payload);

  try {
    const response = await fetch(`${API_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('✅ Response:', data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

submitSample();
