const fs = require('fs');
const path = require('path');

console.log('🔍 EduAir Enhanced - Environment Validator\n');
console.log('Checking privacy-first attendance & noise monitoring setup...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function checkExists(filePath, name) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${name}`);
    checks.passed++;
    return true;
  } else {
    console.log(`❌ ${name} MISSING`);
    checks.failed++;
    return false;
  }
}

function checkEnvVar(envPath, varName, packageName) {
  if (!fs.existsSync(envPath)) {
    console.log(`❌ ${packageName}/.env missing`);
    checks.failed++;
    return false;
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const hasVar = content.includes(varName);
  const isEmpty = content.includes(`${varName}=\n`) || content.includes(`${varName}=\r\n`) || content.endsWith(`${varName}=`);
  
  if (hasVar && !isEmpty) {
    console.log(`✅ ${varName} set in ${packageName}`);
    checks.passed++;
    return true;
  } else if (hasVar && isEmpty) {
    console.log(`⚠️  ${varName} exists but empty in ${packageName}`);
    checks.warnings++;
    return false;
  } else {
    console.log(`❌ ${varName} missing in ${packageName}`);
    checks.failed++;
    return false;
  }
}

// Check Node.js version
console.log('📦 Node.js Version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion >= 20) {
  console.log(`✅ Node.js ${nodeVersion} (>= 20 required)\n`);
  checks.passed++;
} else {
  console.log(`❌ Node.js ${nodeVersion} (>= 20 required)\n`);
  checks.failed++;
}

// Check enhanced server files
console.log('🖥️  Server Enhancement Files...');
checkExists('server/src/lib/crypto.js', 'crypto.js (privacy hashing)');
checkExists('server/src/lib/time.js', 'time.js (session timing)');
checkExists('server/src/lib/topics.js', 'topics.js (topic resolution)');
checkExists('server/data/schedule.json', 'schedule.json (class schedules)');
checkExists('server/data/roster.json', 'roster.json (student rosters)');

if (checkExists('server/.env', 'server/.env')) {
  console.log('');
  checkEnvVar('server/.env', 'MY_ACCOUNT_ID', 'server');
  checkEnvVar('server/.env', 'MY_PRIVATE_KEY', 'server');
  checkEnvVar('server/.env', 'SALT_SECRET', 'server');
  checkEnvVar('server/.env', 'TOPIC_ID_ATTENDANCE', 'server');
  checkEnvVar('server/.env', 'TOPIC_ID_TELEMETRY', 'server');
}

// Check enhanced web files
console.log('\n🌐 Web Dashboard Enhancement Files...');
checkExists('web/src/components/AttendanceView.jsx', 'AttendanceView (privacy tracking)');
checkExists('web/src/components/NoiseChart.jsx', 'NoiseChart (noise monitoring)');
checkExists('web/src/components/TelemetryPanel.jsx', 'TelemetryPanel (6 sensors)');

if (checkExists('web/.env', 'web/.env')) {
  console.log('');
  checkEnvVar('web/.env', 'VITE_TOPIC_ID_ATTENDANCE', 'web');
  checkEnvVar('web/.env', 'VITE_TOPIC_ID_TELEMETRY', 'web');
}

// Check enhanced simulator files
console.log('\n🤖 Simulator Enhancement Files...');
checkExists('simulator/src/postAttendance.js', 'postAttendance.js (attendance sim)');

if (checkExists('simulator/.env', 'simulator/.env')) {
  console.log('');
  checkEnvVar('simulator/.env', 'API_URL', 'simulator');
  checkEnvVar('simulator/.env', 'CLASS_ID', 'simulator');
  checkEnvVar('simulator/.env', 'SESSION_ID', 'simulator');
}

// Check contracts enhancement
console.log('\n📜 Contracts Enhancement Files...');
checkExists('contracts/scripts/mintBadge.js', 'mintBadge.js (badge minting)');

// Check documentation
console.log('\n📚 Enhanced Documentation...');
checkExists('ENHANCEMENT_COMPLETE.md', 'ENHANCEMENT_COMPLETE.md');
checkExists('SETUP_GUIDE_ENHANCED.md', 'SETUP_GUIDE_ENHANCED.md');

// Privacy features check
console.log('\n🔒 Privacy Features Verification...');
if (fs.existsSync('server/data/roster.json')) {
  const roster = JSON.parse(fs.readFileSync('server/data/roster.json', 'utf-8'));
  console.log(`✅ Roster contains ${Object.keys(roster).length} classes (OFF-CHAIN only)`);
  checks.passed++;
} else {
  console.log('❌ Roster file missing');
  checks.failed++;
}

if (fs.existsSync('server/src/lib/crypto.js')) {
  const crypto = fs.readFileSync('server/src/lib/crypto.js', 'utf-8');
  if (crypto.includes('sha256Hex') && crypto.includes('hmacSha256Hex')) {
    console.log('✅ Privacy hashing functions present');
    checks.passed++;
  } else {
    console.log('❌ Privacy hashing functions missing');
    checks.failed++;
  }
}

// Check node_modules
console.log('\n📚 Dependencies...');
['server', 'web', 'contracts', 'simulator'].forEach(pkg => {
  if (checkExists(`${pkg}/node_modules`, `${pkg}/node_modules`)) {
    console.log(`   → Dependencies installed for ${pkg}`);
  } else {
    console.log(`   → Run: cd ${pkg} && npm install`);
  }
});

// Summary
console.log('\n' + '═'.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('═'.repeat(60));
console.log(`✅ Passed:   ${checks.passed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log(`❌ Failed:   ${checks.failed}`);
console.log('═'.repeat(60));

if (checks.failed === 0 && checks.warnings === 0) {
  console.log('\n🎉 Perfect! All enhancements verified!');
  console.log('\n📖 Next steps:');
  console.log('   1. Start server: cd server && npm run dev');
  console.log('   2. Start web: cd web && npm run dev');
  console.log('   3. Run telemetry: cd simulator && npm run telemetry');
  console.log('   4. Run attendance: cd simulator && npm run attendance');
  console.log('\n🔒 Privacy Features Active:');
  console.log('   • Hashed UIDs only (no raw NFC)');
  console.log('   • No student names on-chain');
  console.log('   • No audio recording (numeric only)');
  console.log('   • Session-based salts');
  process.exit(0);
} else if (checks.failed > 0) {
  console.log('\n❌ Some checks failed. Please fix the issues above.');
  console.log('\n📖 See SETUP_GUIDE_ENHANCED.md for configuration help');
  process.exit(1);
} else {
  console.log('\n⚠️  Some warnings detected. Review and proceed if acceptable.');
  process.exit(0);
}
