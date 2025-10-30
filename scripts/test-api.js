#!/usr/bin/env node
/**
 * API Test Script for EduAir Enhanced
 * Tests all new endpoints with sample data
 */

const API_URL = process.env.API_URL || 'http://localhost:8787';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function test(name, fn) {
  process.stdout.write(`\n${name}... `);
  try {
    await fn();
    log('✅ PASS', 'green');
    return true;
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    return false;
  }
}

async function testHealthCheck() {
  const response = await fetch(`${API_URL}/`);
  const data = await response.json();
  if (data.status !== 'healthy') throw new Error('Server not healthy');
  log(`   Service: ${data.service}`, 'cyan');
  log(`   Topics: ${JSON.stringify(data.topics)}`, 'cyan');
}

async function testGetSessionSalt() {
  const classId = 'math-9a';
  const start = '2025-10-01T09:00:00+01:00';
  const url = `${API_URL}/session/salt?classId=${classId}&start=${encodeURIComponent(start)}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.sessionSalt) throw new Error('No session salt returned');
  log(`   Salt: ${data.sessionSalt.slice(0, 16)}...`, 'cyan');
}

async function testSubmitAttendance() {
  const payload = {
    classId: 'math-9a',
    session: '2025-10-01-0900',
    uidHash: '0x' + 'a'.repeat(64), // Fake hash for testing
    ts: Date.now()
  };
  
  const response = await fetch(`${API_URL}/ingest/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  if (data.status !== 'success') throw new Error('Attendance submission failed');
  log(`   Status: ${data.attendanceStatus}`, 'cyan');
  log(`   Consensus: ${data.consensusTimestamp.slice(0, 20)}...`, 'cyan');
}

async function testSubmitTelemetry() {
  const payload = {
    type: 'telemetry',
    classId: 'math-9a',
    session: '2025-10-01-0900',
    deviceId: 'test-device',
    sensors: {
      tempC: 23.5,
      humPct: 45.2,
      co2ppm: 650,
      pm25: 12.0,
      noiseDb: 55.5,
      lightLux: 300
    },
    ts: Date.now()
  };
  
  const response = await fetch(`${API_URL}/ingest/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  if (data.status !== 'success') throw new Error('Telemetry submission failed');
  log(`   Consensus: ${data.consensusTimestamp.slice(0, 20)}...`, 'cyan');
}

async function testGetSchedule() {
  const classId = 'math-9a';
  const response = await fetch(`${API_URL}/schedule/${classId}`);
  const data = await response.json();
  
  if (!data.sessions) throw new Error('No sessions returned');
  log(`   Sessions: ${data.sessions.length}`, 'cyan');
  log(`   Timezone: ${data.timezone}`, 'cyan');
}

async function testGetClasses() {
  const response = await fetch(`${API_URL}/classes`);
  const data = await response.json();
  
  if (!data.classes) throw new Error('No classes returned');
  log(`   Classes: ${data.classes.length}`, 'cyan');
  data.classes.forEach(c => {
    log(`   - ${c.classId}: ${c.studentCount} students, ${c.sessionCount} sessions`, 'cyan');
  });
}

async function testCloseSession() {
  const payload = {
    classId: 'math-9a',
    session: '2025-10-01-0900'
  };
  
  const response = await fetch(`${API_URL}/admin/closeSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  if (data.status !== 'success') throw new Error('Session close failed');
  log(`   Total students: ${data.totalStudents}`, 'cyan');
  log(`   Attended: ${data.attended}`, 'cyan');
  log(`   Marked absent: ${data.markedAbsent}`, 'cyan');
}

async function runTests() {
  log('═'.repeat(60), 'blue');
  log('🧪 EduAir Enhanced API Tests', 'blue');
  log('═'.repeat(60), 'blue');
  log(`\n📡 Testing API at: ${API_URL}`, 'yellow');
  
  const results = [];
  
  // Run all tests
  results.push(await test('1. Health Check', testHealthCheck));
  results.push(await test('2. Get Session Salt', testGetSessionSalt));
  results.push(await test('3. Submit Attendance', testSubmitAttendance));
  results.push(await test('4. Submit Telemetry', testSubmitTelemetry));
  results.push(await test('5. Get Schedule', testGetSchedule));
  results.push(await test('6. Get Classes', testGetClasses));
  results.push(await test('7. Close Session (mark absentees)', testCloseSession));
  
  // Summary
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  log('\n' + '═'.repeat(60), 'blue');
  log('📊 Test Results', 'blue');
  log('═'.repeat(60), 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('═'.repeat(60), 'blue');
  
  if (failed === 0) {
    log('\n🎉 All tests passed! API is working correctly.', 'green');
    log('\n💡 Next: Start the simulators to see live data flow', 'yellow');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Check server logs for details.', 'red');
    process.exit(1);
  }
}

// Check if server is running first
fetch(`${API_URL}/`)
  .then(() => runTests())
  .catch(error => {
    log('\n❌ Cannot connect to server!', 'red');
    log(`   Make sure server is running: cd server && npm run dev`, 'yellow');
    log(`   Error: ${error.message}`, 'red');
    process.exit(1);
  });
