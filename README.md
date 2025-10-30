# EduAir - Privacy-First Classroom Monitoring

Production-ready monorepo for classroom air quality and attendance monitoring with Hedera Consensus Service (HCS), featuring privacy-preserving NFC attendance, noise monitoring, and comprehensive environmental telemetry.

## 🎯 New Features

### ✅ Privacy-Preserving Attendance
- NFC/QR-based attendance tracking
- **Zero PII on-chain** - only salted SHA256 hashes
- On-time/late/absent status detection
- Session-based attendance logs
- Admin tools for marking absentees

### 🔊 Noise Monitoring
- Real-time classroom noise levels (dB)
- **No audio recording** - numeric levels only
- Visual noise bands (quiet → very loud)
- Trend charts and analytics
- Privacy-compliant monitoring

### 🌡️ Enhanced Telemetry
- Temperature & Humidity
- CO₂ levels (ppm)
- PM2.5 air quality
- Light levels (lux)
- Noise levels (dB)
- All metrics with status indicators

## 🏗️ Architecture

- **server/**: Enhanced Node.js API with attendance + telemetry endpoints
- **web/**: React dashboard with 4 tabs (Telemetry, Noise, Attendance, Settings)
- **contracts/**: Solidity ERC-721 NFT badges with optional SBT mode
- **simulator/**: Dual simulators for telemetry and attendance

## 🔒 Privacy & Security

**Critical Privacy Features:**
- ✅ **No raw NFC UIDs on-chain** - only salted hashes
- ✅ **No student names on-chain** - roster stays server-side
- ✅ **No audio recording** - only numeric noise levels
- ✅ **Session-based salts** - different hashes per session
- ✅ **Client-side hashing** - devices can hash locally

**How Privacy Works:**
```
Raw UID → SHA256(UID + SessionSalt) → On-Chain Hash
"04AABBCCDD" → "0x2f3a..." → Blockchain ✅
Student Name → NEVER LEAVES SERVER → Never on-chain ✅
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Hedera Testnet account ([portal.hedera.com](https://portal.hedera.com))
- MetaMask with test HBAR

### 1. Install Dependencies
```bash
cd server && npm install && cd ..
cd web && npm install && cd ..
cd contracts && npm install && cd ..
cd simulator && npm install && cd ..
```

### 2. Create Topics
```bash
cd server
cp .env.example .env
# Add MY_ACCOUNT_ID and MY_PRIVATE_KEY

# Create attendance topic
npm run create:topic
# Note the Topic ID - this is TOPIC_ID_ATTENDANCE

# Create telemetry topic
npm run create:topic
# Note the Topic ID - this is TOPIC_ID_TELEMETRY

# Add both to server/.env
```

### 3. Configure Environment Files

**server/.env:**
```bash
MY_ACCOUNT_ID=0.0.xxxxx
MY_PRIVATE_KEY=302e...
TOPIC_ID_ATTENDANCE=0.0.aaaaa
TOPIC_ID_TELEMETRY=0.0.bbbbb
SALT_SECRET=your-super-secret-salt-change-me
LATE_TOLERANCE_MIN=5
PORT=8787
```

**web/.env:**
```bash
VITE_TOPIC_ID_ATTENDANCE=0.0.aaaaa
VITE_TOPIC_ID_TELEMETRY=0.0.bbbbb
VITE_MIRROR_URL=https://testnet.mirrornode.hedera.com
VITE_HASHIO_RPC=https://testnet.hashio.io/api
VITE_DONATION_ADDRESS=0xYourEvmAddress
```

**simulator/.env:**
```bash
API_URL=http://localhost:8787
CLASS_ID=math-9a
SESSION_ID=2025-10-01-0900
SESSION_START=2025-10-01T09:00:00+01:00
DEVICE_ID=classroom-sensor-001
INTERVAL_MS=10000
RUNTIME_MIN=5
```

### 4. Run the System (4 Terminals)

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Web Dashboard:**
```bash
cd web
npm run dev
# Opens http://localhost:5173
```

**Terminal 3 - Telemetry Simulator:**
```bash
cd simulator
npm run telemetry
```

**Terminal 4 - Attendance Simulator:**
```bash
cd simulator
npm run attendance
```

### 5. Use the Dashboard

1. Open http://localhost:5173
2. Navigate through tabs:
   - **📊 Telemetry**: View all environmental metrics
   - **🔊 Noise**: See noise trends and levels
   - **👥 Attendance**: Track student attendance
   - **⚙️ Settings**: Configure topic IDs
3. Connect MetaMask (Hedera Testnet)
4. Send HBAR tip to support the class

## 📊 API Endpoints

### Attendance
```bash
# Get session salt (for client-side hashing)
GET /session/salt?classId=math-9a&start=2025-10-01T09:00:00+01:00

# Submit attendance
POST /ingest/attendance
{
  "classId": "math-9a",
  "session": "2025-10-01-0900",
  "uidHash": "0x2f3a...",
  "ts": 1633062800000
}

# Mark absentees (admin)
POST /admin/closeSession
{
  "classId": "math-9a",
  "session": "2025-10-01-0900"
}
```

### Telemetry
```bash
POST /ingest/telemetry
{
  "type": "telemetry",
  "classId": "math-9a",
  "session": "2025-10-01-0900",
  "sensors": {
    "tempC": 24.1,
    "humPct": 43.5,
    "co2ppm": 780,
    "pm25": 12.0,
    "noiseDb": 62.3,
    "lightLux": 300
  },
  "ts": 1633062860000
}
```

### Utility
```bash
# Health check
GET /

# Get class schedule
GET /schedule/:classId

# List all classes
GET /classes
```

## 📱 Dashboard Features

### Telemetry Tab
- Live metrics cards with color-coded status
- 6 sensors: Temp, Humidity, CO₂, PM2.5, Noise, Light
- Auto-refresh every 10 seconds
- Class/session info

### Noise Tab
- Real-time noise level (dB)
- Color-coded bands (quiet → very loud)
- Trend chart (last 30 readings)
- Average noise calculation
- Privacy note (no audio recording)

### Attendance Tab
- On-time / Late / Absent counts
- Filterable by class and session
- UID hash display (partial, for privacy)
- Status chips with colors
- Privacy note (only hashes on-chain)

### Settings Tab
- Configure topic IDs at runtime
- View network information
- Persistent localStorage
- Can use single or dual topics

## 🛠️ Development

### Server Structure
```
server/
├── src/
│   ├── server.js          # Main Express app
│   ├── createTopic.js     # HCS topic creation
│   ├── submitSample.js    # Test script
│   └── lib/
│       ├── crypto.js      # SHA256, HMAC utilities
│       ├── time.js        # Session timing helpers
│       └── topics.js      # Topic resolution
└── data/
    ├── schedule.json      # Class schedules
    └── roster.json        # Student rosters (PII - never published)
```

### Web Structure
```
web/
├── src/
│   ├── App.jsx                    # Main app with tabs
│   ├── App.css                    # Styles
│   ├── main.jsx                   # Entry point
│   ├── components/
│   │   ├── AttendanceView.jsx    # Attendance tracking
│   │   ├── NoiseChart.jsx        # Noise monitoring
│   │   └── TelemetryPanel.jsx    # Environmental metrics
│   └── lib/
│       ├── eth.js                 # MetaMask/Ethers
│       └── mirror.js              # Mirror Node API
```

### Simulator Structure
```
simulator/
└── src/
    ├── postDeviceReading.js    # Telemetry simulator
    └── postAttendance.js       # Attendance simulator
```

## 🔐 Security Best Practices

### Critical Rules
1. **Never commit .env files** - Always use .env.example
2. **Change SALT_SECRET** - Use a strong random secret
3. **Keep rosters private** - Names never go on-chain
4. **Rotate salts** - Consider per-session salts (already implemented)
5. **No audio** - Only numeric noise levels

### Privacy Guarantees
- ✅ Student names: Stay in `roster.json` on server
- ✅ NFC UIDs: Hashed with session salt before publishing
- ✅ Audio content: Never captured or transmitted
- ✅ Telemetry: Only aggregated metrics, no personal data

## 🎓 Testing Workflow

1. **Start Server** - Handles all API requests
2. **Start Web** - View dashboard
3. **Run Telemetry Simulator** - See environmental data
4. **Run Attendance Simulator** - See attendance events
5. **Check Dashboard** - All tabs should show live data
6. **Test Admin** - Call `/admin/closeSession` to mark absentees
7. **Connect Wallet** - Test HBAR tipping

## 📚 Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup instructions
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [SECURITY.md](./SECURITY.md) - Security best practices
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- Package-specific READMEs in each folder

## 🎯 Use Cases

### Classroom Monitoring
- Track air quality (CO₂, PM2.5) for health
- Monitor noise levels for focus
- Privacy-preserving attendance
- NFT badges for achievements

### Building Management
- Multi-room environmental monitoring
- Occupancy tracking (hashed)
- Energy efficiency insights
- Compliance reporting

### Research & Development
- Blockchain-verified data collection
- Privacy-compliant studies
- Reproducible measurements
- Tamper-proof records

## 🔄 Message Flow

```
Device/Simulator → Server API → Hedera HCS → Mirror Node → Web Dashboard
     ↓                                                          ↑
   Hash UID                                               Fetch & Display
(client-side)                                           (polls every 10-15s)
```

## 💰 Costs (Testnet)

- HCS Messages: FREE (testnet)
- Topics: FREE (testnet)
- NFT Deploy: FREE (testnet)
- Server: FREE (localhost) or $7-15/month (cloud)
- Web: FREE (localhost) or FREE-$20/month (Vercel/Netlify)

**Production (Mainnet):**
- HCS: ~$0.0001 per message
- Very affordable even at scale

## 🏆 Features

### ✅ Core
- [x] Privacy-preserving attendance (hashed UIDs)
- [x] Noise monitoring (no audio)
- [x] 6-sensor telemetry
- [x] Dual HCS topics
- [x] Session-based salts
- [x] On-time/late/absent detection
- [x] Admin absent marking
- [x] MetaMask integration
- [x] HBAR tipping
- [x] NFT badges

### ✅ Dashboard
- [x] 4-tab interface
- [x] Live data updates
- [x] Colored status indicators
- [x] Trend charts
- [x] Privacy notes
- [x] Topic ID settings
- [x] LocalStorage persistence

### ✅ Simulators
- [x] Realistic telemetry generation
- [x] Attendance scenarios (on-time/late/absent)
- [x] Client-side UID hashing
- [x] Configurable intervals
- [x] Runtime limits

## 🌟 Next Steps

1. **Add Real Hardware** - Connect ESP32 with sensors and NFC reader
2. **Deploy to Cloud** - Heroku/DigitalOcean for server, Vercel for web
3. **Switch to Mainnet** - Use real HBAR (very affordable)
4. **Add Authentication** - API keys for production
5. **Implement Alerts** - CO₂ thresholds, noise limits
6. **Badge Achievements** - Auto-mint for perfect attendance

## 🆘 Getting Help

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Run `node validate-env.js` to check configuration
- Review server logs for errors
- Ensure all .env files are configured
- Verify topic IDs match between server and web

## 📄 License

MIT License - See [LICENSE](./LICENSE)

## 🙏 Acknowledgments

- Hedera for enterprise-grade DLT
- Hashio for JSON-RPC access
- OpenZeppelin for secure contracts
- React & Vite for modern web development

---

**Built with privacy, security, and education in mind** 🔒🎓✨

*Your data. Your control. Blockchain-verified.*
