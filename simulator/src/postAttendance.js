import dotenv from 'dotenv';
import { createHash } from 'crypto';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:8787';
const CLASS_ID = process.env.CLASS_ID || 'math-9a';
const SESSION_ID = process.env.SESSION_ID || '2025-10-01-0900';
const SESSION_START = process.env.SESSION_START || '2025-10-01T09:00:00+01:00';

// Demo student card UIDs (matches roster.json)
const STUDENTS = [
  { id: 's-001', name: 'Alice', cardUid: '04AABBCCDD' },
  { id: 's-002', name: 'Bob', cardUid: '0499887766' },
  { id: 's-003', name: 'Charlie', cardUid: '045566AABB' },
  { id: 's-004', name: 'Diana', cardUid: '04CCDDEE11' },
  { id: 's-005', name: 'Eve', cardUid: '04112233FF' }
];

// Compute UID hash client-side
function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

function computeUidHash(uidHex, sessionSalt) {
  const combined = uidHex + sessionSalt;
  const hash = sha256Hex(combined);
  return '0x' + hash;
}

async function fetchSessionSalt() {
  const url = `${API_URL}/session/salt?classId=${CLASS_ID}&start=${encodeURIComponent(SESSION_START)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.sessionSalt;
}

async function submitAttendance(uidHash, timestamp) {
  const payload = {
    classId: CLASS_ID,
    session: SESSION_ID,
    uidHash,
    ts: timestamp
  };

  const response = await fetch(`${API_URL}/ingest/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return response.json();
}

async function simulateAttendance() {
  console.log('🎓 EduAir Attendance Simulator');
  console.log('═'.repeat(60));
  console.log(`📚 Class:   ${CLASS_ID}`);
  console.log(`📅 Session: ${SESSION_ID}`);
  console.log(`🕐 Start:   ${SESSION_START}`);
  console.log(`📡 API:     ${API_URL}`);
  console.log('═'.repeat(60));

  try {
    // Fetch session salt from server
    console.log('\n🔐 Fetching session salt...');
    const sessionSalt = await fetchSessionSalt();
    console.log(`✅ Session salt: ${sessionSalt.slice(0, 16)}...`);

    const sessionStartTime = new Date(SESSION_START).getTime();
    const results = [];

    // Simulate realistic attendance:
    // - 70% on-time (within tolerance)
    // - 20% late (5-15 minutes)
    // - 10% absent (no event sent)

    console.log('\n📋 Simulating attendance events:\n');

    for (let i = 0; i < STUDENTS.length; i++) {
      const student = STUDENTS[i];
      const rand = Math.random();

      if (rand < 0.1) {
        // 10% absent - don't send event
        console.log(`❌ ${student.name} (${student.id}): Absent (no event)`);
        continue;
      }

      // Compute UID hash
      const uidHash = computeUidHash(student.cardUid, sessionSalt);

      let timestamp;
      let expectedStatus;

      if (rand < 0.8) {
        // 70% on-time (0-5 min after start)
        const offset = Math.floor(Math.random() * 3) * 60 * 1000; // 0-2 min
        timestamp = sessionStartTime + offset;
        expectedStatus = 'present_on_time';
      } else {
        // 20% late (6-15 min after start)
        const offset = (6 + Math.floor(Math.random() * 10)) * 60 * 1000;
        timestamp = sessionStartTime + offset;
        expectedStatus = 'late';
      }

      const delay = new Date(timestamp).toLocaleTimeString();
      console.log(`📱 ${student.name} (${student.id}): Tapping at ${delay}...`);

      // Submit attendance
      const result = await submitAttendance(uidHash, timestamp);

      if (result.status === 'success') {
        const status = result.attendanceStatus;
        const icon = status === 'present_on_time' ? '✅' : '⏰';
        console.log(`   ${icon} Recorded as: ${status}`);
        console.log(`   🔗 Consensus: ${result.consensusTimestamp.slice(0, 20)}...`);
      } else {
        console.log(`   ❌ Error: ${result.message}`);
      }

      results.push({
        student: student.name,
        status: result.attendanceStatus
      });

      // Small delay between submissions
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 ATTENDANCE SUMMARY');
    console.log('═'.repeat(60));
    const onTime = results.filter(r => r.status === 'present_on_time').length;
    const late = results.filter(r => r.status === 'late').length;
    const absent = STUDENTS.length - results.length;

    console.log(`✅ On-Time: ${onTime}`);
    console.log(`⏰ Late:    ${late}`);
    console.log(`❌ Absent:  ${absent}`);
    console.log(`📝 Total:   ${STUDENTS.length}`);
    console.log('═'.repeat(60));

    console.log('\n💡 Next steps:');
    console.log(`   1. Open dashboard: http://localhost:5173`);
    console.log(`   2. Navigate to Attendance tab`);
    console.log(`   3. Select class: ${CLASS_ID}, session: ${SESSION_ID}`);
    console.log(`   4. See attendance records appear!`);
    console.log(`\n   To mark remaining students absent:`);
    console.log(`   POST ${API_URL}/admin/closeSession`);
    console.log(`   Body: { "classId": "${CLASS_ID}", "session": "${SESSION_ID}" }`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Make sure the server is running!');
    process.exit(1);
  }
}

simulateAttendance();
