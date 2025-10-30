import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:8787';
const CLASS_ID = process.env.CLASS_ID || 'math-9a';
const SESSION_ID = process.env.SESSION_ID || '2025-10-01-0900';
const DEVICE_ID = process.env.DEVICE_ID || 'classroom-sensor-001';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '10000'); // 10 seconds
const RUNTIME_MIN = parseInt(process.env.RUNTIME_MIN || '5'); // 5 minutes

let iterationCount = 0;
const maxIterations = (RUNTIME_MIN * 60 * 1000) / INTERVAL_MS;

// Realistic sensor ranges
const RANGES = {
  tempC: { min: 20, max: 28, baseline: 23 },
  humPct: { min: 35, max: 65, baseline: 45 },
  co2ppm: { min: 400, max: 1200, baseline: 600 },
  pm25: { min: 5, max: 30, baseline: 12 },
  noiseDb: { min: 40, max: 80, baseline: 52 },
  lightLux: { min: 150, max: 500, baseline: 300 }
};

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function generateRealisticValue(key, lastValue = null) {
  const range = RANGES[key];
  
  if (!lastValue) {
    // First reading - near baseline
    return range.baseline + (Math.random() - 0.5) * (range.max - range.min) * 0.2;
  }
  
  // Gradual drift with occasional spikes
  const drift = (Math.random() - 0.5) * 2; // Small change
  const spike = Math.random() < 0.05 ? (Math.random() - 0.5) * 10 : 0; // 5% chance of spike
  
  let newValue = lastValue + drift + spike;
  
  // Clamp to realistic range
  newValue = Math.max(range.min, Math.min(range.max, newValue));
  
  return newValue;
}

function generateNoiseLevel(time) {
  // Noise varies throughout session
  // Start: settling in (65dB)
  // Middle: quiet focused work (45-55dB)
  // End: discussions (60-70dB)
  
  const progress = iterationCount / maxIterations;
  
  if (progress < 0.1) {
    // First 10% - students settling
    return randomInRange(60, 70);
  } else if (progress < 0.7) {
    // Middle 60% - focused work
    return randomInRange(45, 58);
  } else {
    // Last 30% - discussions
    return randomInRange(58, 72);
  }
}

// Store last readings for continuity
let lastReadings = null;

async function generateTelemetry() {
  const sensors = {
    tempC: parseFloat(generateRealisticValue('tempC', lastReadings?.tempC).toFixed(1)),
    humPct: parseFloat(generateRealisticValue('humPct', lastReadings?.humPct).toFixed(1)),
    co2ppm: Math.round(generateRealisticValue('co2ppm', lastReadings?.co2ppm)),
    pm25: parseFloat(generateRealisticValue('pm25', lastReadings?.pm25).toFixed(1)),
    noiseDb: parseFloat(generateNoiseLevel().toFixed(1)),
    lightLux: Math.round(generateRealisticValue('lightLux', lastReadings?.lightLux))
  };
  
  lastReadings = sensors;
  
  return {
    type: 'telemetry',
    classId: CLASS_ID,
    session: SESSION_ID,
    deviceId: DEVICE_ID,
    sensors,
    ts: Date.now()
  };
}

function getNoiseDescription(db) {
  if (db < 50) return '🔇 Very Quiet';
  if (db < 60) return '🤫 Quiet';
  if (db < 70) return '🗣️  Normal';
  if (db < 75) return '📢 Loud';
  return '🚨 Very Loud';
}

function getCO2Status(ppm) {
  if (ppm < 600) return '✅ Excellent';
  if (ppm < 800) return '✅ Good';
  if (ppm < 1000) return '⚠️  Fair';
  return '❌ Poor';
}

async function postTelemetry(payload) {
  try {
    const response = await fetch(`${API_URL}/ingest/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error posting telemetry:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function runSimulator() {
  console.log('🌡️  EduAir Enhanced Telemetry Simulator');
  console.log('═'.repeat(70));
  console.log(`📚 Class:    ${CLASS_ID}`);
  console.log(`📅 Session:  ${SESSION_ID}`);
  console.log(`🔧 Device:   ${DEVICE_ID}`);
  console.log(`📡 API:      ${API_URL}`);
  console.log(`⏱️  Interval: ${INTERVAL_MS / 1000}s`);
  console.log(`⏰ Runtime:  ${RUNTIME_MIN} minutes (${maxIterations} readings)`);
  console.log('═'.repeat(70));
  console.log('📊 Monitoring: Temperature | Humidity | CO2 | PM2.5 | Noise | Light\n');

  const interval = setInterval(async () => {
    iterationCount++;

    const telemetry = await generateTelemetry();
    const { sensors } = telemetry;

    console.log(`📡 Reading #${iterationCount}/${maxIterations}`);
    console.log(`   🌡️  Temp:     ${sensors.tempC}°C`);
    console.log(`   💧 Humidity: ${sensors.humPct}%`);
    console.log(`   🫁 CO2:      ${sensors.co2ppm} ppm ${getCO2Status(sensors.co2ppm)}`);
    console.log(`   💨 PM2.5:    ${sensors.pm25} µg/m³`);
    console.log(`   🔊 Noise:    ${sensors.noiseDb} dB ${getNoiseDescription(sensors.noiseDb)}`);
    console.log(`   💡 Light:    ${sensors.lightLux} lux`);

    const result = await postTelemetry(telemetry);

    if (result.status === 'success') {
      console.log(`   ✅ Published to HCS: ${result.consensusTimestamp.slice(0, 20)}...`);
    } else {
      console.log(`   ❌ Error: ${result.message}`);
    }

    console.log('');

    if (iterationCount >= maxIterations) {
      console.log('═'.repeat(70));
      console.log('✅ Simulation complete!');
      console.log(`📊 Total readings sent: ${iterationCount}`);
      console.log(`🕐 Duration: ${RUNTIME_MIN} minutes`);
      console.log('═'.repeat(70));
      console.log('\n💡 View data on dashboard:');
      console.log('   http://localhost:5173');
      console.log('   → Navigate to Telemetry or Noise tabs');
      console.log('   → See live charts and metrics update!');
      
      clearInterval(interval);
      process.exit(0);
    }
  }, INTERVAL_MS);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Simulator stopped by user');
    console.log(`📊 Readings sent: ${iterationCount}/${maxIterations}`);
    clearInterval(interval);
    process.exit(0);
  });
}

console.log('🚀 Starting in 3 seconds...\n');
setTimeout(runSimulator, 3000);
