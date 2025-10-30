import React, { useState, useEffect } from 'react';
import { connectWallet, sendTip, ensureHederaNetwork } from './lib/eth';
import AttendanceView from './components/AttendanceView';
import NoiseChart from './components/NoiseChart';
import TelemetryPanel from './components/TelemetryPanel';

function App() {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [wallet, setWallet] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Topic IDs (with localStorage persistence)
  const [topicIdAttendance, setTopicIdAttendance] = useState(
    localStorage.getItem('topicIdAttendance') || import.meta.env.VITE_TOPIC_ID_ATTENDANCE || ''
  );
  const [topicIdTelemetry, setTopicIdTelemetry] = useState(
    localStorage.getItem('topicIdTelemetry') || import.meta.env.VITE_TOPIC_ID_TELEMETRY || ''
  );

  const mirrorUrl = import.meta.env.VITE_MIRROR_URL || 'https://testnet.mirrornode.hedera.com';

  // Save to localStorage when changed
  useEffect(() => {
    if (topicIdAttendance) localStorage.setItem('topicIdAttendance', topicIdAttendance);
  }, [topicIdAttendance]);

  useEffect(() => {
    if (topicIdTelemetry) localStorage.setItem('topicIdTelemetry', topicIdTelemetry);
  }, [topicIdTelemetry]);

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      await ensureHederaNetwork();
      setWallet(address);
      setStatus(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (error) {
      setStatus(`Wallet error: ${error.message}`);
    }
  };

  const handleTip = async () => {
    if (!wallet) {
      setStatus('Please connect wallet first');
      return;
    }
    setLoading(true);
    setStatus('Sending tip...');
    try {
      const txHash = await sendTip();
      setStatus(`Tip sent! TX: ${txHash.slice(0, 10)}...`);
    } catch (error) {
      setStatus(`Tip failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'telemetry', label: '📊 Telemetry', icon: '🌡️' },
    { id: 'noise', label: '🔊 Noise', icon: '📢' },
    { id: 'attendance', label: '👥 Attendance', icon: '✅' },
    { id: 'settings', label: '⚙️ Settings', icon: '🔧' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <header style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '2px solid rgba(0,0,0,0.1)',
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px' }}>🌡️ EduAir Enhanced</h1>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                Privacy-Preserving Classroom Monitoring on Hedera
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {!wallet ? (
                <button onClick={handleConnect} style={{ padding: '12px 24px', fontSize: '16px' }}>
                  🦊 Connect Wallet
                </button>
              ) : (
                <div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                    ✅ {wallet.slice(0, 6)}...{wallet.slice(-4)}
                  </div>
                  <button onClick={handleTip} disabled={loading} style={{ padding: '10px 20px' }}>
                    💰 Tip Class (0.001 HBAR)
                  </button>
                </div>
              )}
            </div>
          </div>

          {status && (
            <div style={{ 
              padding: '10px', 
              background: '#f0f9ff', 
              borderRadius: '5px', 
              fontSize: '14px',
              border: '1px solid #bae6fd',
              color: '#0369a1'
            }}>
              {status}
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div style={{ background: 'rgba(255, 255, 255, 0.9)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '5px', padding: '0 20px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '15px 25px',
                border: 'none',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                color: activeTab === tab.id ? '#667eea' : '#64748b',
                transition: 'all 0.3s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minHeight: '600px'
        }}>
          {activeTab === 'telemetry' && (
            <TelemetryPanel 
              topicId={topicIdTelemetry} 
              mirrorUrl={mirrorUrl}
            />
          )}

          {activeTab === 'noise' && (
            <NoiseChart 
              topicId={topicIdTelemetry} 
              mirrorUrl={mirrorUrl}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView 
              topicId={topicIdAttendance} 
              mirrorUrl={mirrorUrl}
            />
          )}

          {activeTab === 'settings' && (
            <div style={{ padding: '20px' }}>
              <h2>⚙️ Settings</h2>
              <p style={{ color: '#666', marginBottom: '30px' }}>
                Configure topic IDs and connection settings
              </p>

              <div style={{ maxWidth: '600px' }}>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                    📡 Attendance Topic ID
                  </label>
                  <input
                    type="text"
                    value={topicIdAttendance}
                    onChange={(e) => setTopicIdAttendance(e.target.value)}
                    placeholder="0.0.xxxxx"
                    style={{ width: '100%', padding: '12px', fontSize: '14px' }}
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                    HCS topic for attendance events
                  </div>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                    📊 Telemetry Topic ID
                  </label>
                  <input
                    type="text"
                    value={topicIdTelemetry}
                    onChange={(e) => setTopicIdTelemetry(e.target.value)}
                    placeholder="0.0.yyyyy"
                    style={{ width: '100%', padding: '12px', fontSize: '14px' }}
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                    HCS topic for sensor telemetry and noise
                  </div>
                </div>

                <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <strong style={{ color: '#0369a1' }}>💡 Tip:</strong>
                  <p style={{ margin: '5px 0 0 0', color: '#075985', fontSize: '14px' }}>
                    Topic IDs are saved to localStorage. Use dedicated topics for better organization, or use the same topic ID for both (messages will include a "type" field).
                  </p>
                </div>

                <div style={{ marginTop: '30px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                  <h4 style={{ marginTop: 0 }}>Network Information</h4>
                  <div style={{ fontSize: '14px', color: '#475569' }}>
                    <div><strong>Mirror Node:</strong> {mirrorUrl}</div>
                    <div><strong>Hashio RPC:</strong> {import.meta.env.VITE_HASHIO_RPC}</div>
                    <div><strong>Chain ID:</strong> 296 (Hedera Testnet)</div>
                    <div><strong>Donation Address:</strong> {import.meta.env.VITE_DONATION_ADDRESS?.slice(0, 10)}...</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '30px 20px', 
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0 }}>Built with Hedera HCS • Hashio • React • Privacy-First Design</p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
          🔒 No PII on-chain • 🔇 No audio recording • ✅ Open source
        </p>
      </footer>
    </div>
  );
}

export default App;
