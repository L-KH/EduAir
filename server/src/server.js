import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, TopicMessageSubmitTransaction } from '@hashgraph/sdk';
import { deriveSessionSalt, computeUidHash } from './lib/crypto.js';
import { determineStatus } from './lib/time.js';
import { resolveTopicIdByType, getTopicConfig } from './lib/topics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Hedera client
const { MY_ACCOUNT_ID, MY_PRIVATE_KEY } = process.env;

if (!MY_ACCOUNT_ID || !MY_PRIVATE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const client = Client.forTestnet().setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

// Load schedule and roster
const scheduleData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/schedule.json'), 'utf-8')
);
const rosterData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/roster.json'), 'utf-8')
);

// Track attendance in-memory (for absent marking)
const attendanceLog = new Map(); // key: "classId:session", value: Set<uidHash>

// Helper: Find session by ID
function findSession(classId, sessionId) {
  const classSchedule = scheduleData[classId];
  if (!classSchedule) return null;
  return classSchedule.sessions.find(s => s.id === sessionId);
}

// Helper: Publish to HCS
async function publishToHCS(topicId, payload) {
  const transaction = new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(JSON.stringify(payload));

  const txResponse = await transaction.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const consensusTimestamp = txResponse.consensusTimestamp;

  console.log(`✅ Published to ${topicId}:`, consensusTimestamp.toString());
  return consensusTimestamp.toString();
}

// Health check
app.get('/', (req, res) => {
  const config = getTopicConfig();
  res.json({
    status: 'healthy',
    service: 'EduAir Enhanced HCS API',
    topics: config,
    features: ['attendance', 'telemetry', 'noise-monitoring', 'privacy-preserving']
  });
});

// Get session salt (for client-side hashing)
app.get('/session/salt', (req, res) => {
  const { classId, start } = req.query;

  if (!classId || !start) {
    return res.status(400).json({
      error: 'Missing required parameters: classId and start'
    });
  }

  const SALT_SECRET = process.env.SALT_SECRET || 'default-secret-change-me';
  const sessionSalt = deriveSessionSalt(SALT_SECRET, classId, start);

  res.json({ sessionSalt });
});

// Generic ingest endpoint (legacy support)
app.post('/ingest', async (req, res) => {
  try {
    const { type } = req.body;

    if (type === 'attendance') {
      return handleAttendance(req, res);
    } else if (type === 'telemetry') {
      return handleTelemetry(req, res);
    } else {
      // Default to telemetry for backwards compatibility
      return handleTelemetry(req, res);
    }
  } catch (error) {
    console.error('❌ Error in /ingest:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Dedicated attendance endpoint
app.post('/ingest/attendance', handleAttendance);

async function handleAttendance(req, res) {
  try {
    const { classId, session, uidHash, ts } = req.body;

    // Validation
    if (!classId || !session || !uidHash) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: classId, session, uidHash'
      });
    }

    // Find session in schedule
    const sessionInfo = findSession(classId, session);
    if (!sessionInfo) {
      return res.status(404).json({
        status: 'error',
        message: `Session ${session} not found for class ${classId}`
      });
    }

    // Determine status
    const timestamp = ts || Date.now();
    const LATE_TOLERANCE_MIN = parseInt(process.env.LATE_TOLERANCE_MIN || '5');
    const status = determineStatus(timestamp, sessionInfo.startIso, LATE_TOLERANCE_MIN);

    // Track attendance
    const logKey = `${classId}:${session}`;
    if (!attendanceLog.has(logKey)) {
      attendanceLog.set(logKey, new Set());
    }
    attendanceLog.get(logKey).add(uidHash);

    // Publish to HCS
    const payload = {
      type: 'attendance',
      classId,
      session,
      uidHash,
      status,
      ts: timestamp
    };

    const topicId = resolveTopicIdByType('attendance');
    const consensusTimestamp = await publishToHCS(topicId, payload);

    res.json({
      status: 'success',
      attendanceStatus: status,
      consensusTimestamp,
      topicId
    });

  } catch (error) {
    console.error('❌ Error processing attendance:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
}

// Dedicated telemetry endpoint
app.post('/ingest/telemetry', handleTelemetry);

async function handleTelemetry(req, res) {
  try {
    const { classId, session, sensors, deviceId, ts } = req.body;

    // Validation (basic)
    if (!sensors) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing sensors object'
      });
    }

    // Build payload
    const payload = {
      type: 'telemetry',
      classId: classId || 'unknown',
      session: session || 'unknown',
      deviceId: deviceId || 'unknown',
      sensors,
      ts: ts || Date.now()
    };

    // Publish to HCS
    const topicId = resolveTopicIdByType('telemetry');
    const consensusTimestamp = await publishToHCS(topicId, payload);

    res.json({
      status: 'success',
      consensusTimestamp,
      topicId
    });

  } catch (error) {
    console.error('❌ Error processing telemetry:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
}

// Admin: Close session and mark absentees
app.post('/admin/closeSession', async (req, res) => {
  try {
    const { classId, session } = req.body;

    if (!classId || !session) {
      return res.status(400).json({
        error: 'Missing classId or session'
      });
    }

    // Get session info
    const sessionInfo = findSession(classId, session);
    if (!sessionInfo) {
      return res.status(404).json({
        error: `Session ${session} not found`
      });
    }

    // Get roster
    const roster = rosterData[classId];
    if (!roster) {
      return res.status(404).json({
        error: `Roster not found for class ${classId}`
      });
    }

    // Get attended UIDs
    const logKey = `${classId}:${session}`;
    const attendedHashes = attendanceLog.get(logKey) || new Set();

    // Compute absentees
    const SALT_SECRET = process.env.SALT_SECRET || 'default-secret-change-me';
    const sessionSalt = deriveSessionSalt(SALT_SECRET, classId, sessionInfo.startIso);
    
    const absentees = [];
    const timestamp = Date.now();
    const topicId = resolveTopicIdByType('attendance');

    for (const student of roster.students) {
      const uidHash = computeUidHash(student.cardUidHex, sessionSalt);
      
      if (!attendedHashes.has(uidHash)) {
        // Mark as absent
        const payload = {
          type: 'attendance',
          classId,
          session,
          uidHash,
          status: 'absent_marked',
          ts: timestamp
        };

        await publishToHCS(topicId, payload);
        absentees.push({
          studentId: student.studentId,
          uidHash
        });

        // Add to attendance log
        attendedHashes.add(uidHash);
      }
    }

    attendanceLog.set(logKey, attendedHashes);

    res.json({
      status: 'success',
      classId,
      session,
      totalStudents: roster.students.length,
      attended: attendedHashes.size - absentees.length,
      markedAbsent: absentees.length,
      absentees
    });

  } catch (error) {
    console.error('❌ Error closing session:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get schedule (for client reference)
app.get('/schedule/:classId', (req, res) => {
  const { classId } = req.params;
  const schedule = scheduleData[classId];

  if (!schedule) {
    return res.status(404).json({ error: 'Class not found' });
  }

  res.json(schedule);
});

// List all classes
app.get('/classes', (req, res) => {
  const classes = Object.keys(scheduleData).map(classId => ({
    classId,
    sessionCount: scheduleData[classId].sessions.length,
    studentCount: rosterData[classId]?.students.length || 0
  }));

  res.json({ classes });
});

app.listen(PORT, () => {
  console.log('═'.repeat(60));
  console.log('🚀 EduAir Enhanced HCS API');
  console.log('═'.repeat(60));
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🔐 Privacy: Enabled (hashed UIDs only)`);
  console.log(`📊 Features: Attendance + Telemetry + Noise`);
  console.log('');
  console.log('📌 Topics:');
  const config = getTopicConfig();
  console.log(`   Attendance: ${config.attendance || 'Not set'}`);
  console.log(`   Telemetry:  ${config.telemetry || 'Not set'}`);
  if (config.dedicated) {
    console.log(`   Mode: Dedicated topics`);
  } else {
    console.log(`   Mode: Single topic (${config.fallback})`);
  }
  console.log('═'.repeat(60));
});
