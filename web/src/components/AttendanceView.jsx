import React, { useState, useEffect } from 'react';

function AttendanceView({ topicId, mirrorUrl }) {
  const [messages, setMessages] = useState([]);
  const [classId, setClassId] = useState('math-9a');
  const [sessionId, setSessionId] = useState('2025-10-01-0900');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAttendance = async () => {
    if (!topicId) {
      setError('No topic ID configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${mirrorUrl}/api/v1/topics/${topicId}/messages?limit=200&order=desc`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mirror Node error: ${response.statusText}`);
      }

      const data = await response.json();
      
      const decoded = data.messages.map(msg => {
        try {
          const text = Buffer.from(msg.message, 'base64').toString('utf-8');
          const parsed = JSON.parse(text);
          return {
            ...parsed,
            consensusTimestamp: msg.consensus_timestamp,
            sequenceNumber: msg.sequence_number
          };
        } catch (e) {
          return null;
        }
      }).filter(m => m && m.type === 'attendance');

      setMessages(decoded);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [topicId, mirrorUrl]);

  // Filter messages by class and session
  const filtered = messages.filter(m => 
    m.classId === classId && m.session === sessionId
  );

  // Calculate stats
  const onTime = filtered.filter(m => m.status === 'present_on_time').length;
  const late = filtered.filter(m => m.status === 'late').length;
  const absent = filtered.filter(m => m.status === 'absent_marked').length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'present_on_time': return '#4ade80';
      case 'late': return '#fbbf24';
      case 'absent_marked': return '#f87171';
      default: return '#94a3b8';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present_on_time': return '✅';
      case 'late': return '⏰';
      case 'absent_marked': return '❌';
      default: return '❓';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>👥 Attendance Tracking</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Privacy-preserving attendance with hashed student IDs
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Class ID
          </label>
          <input
            type="text"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            placeholder="math-9a"
            style={{ padding: '8px', width: '150px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Session ID
          </label>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="2025-10-01-0900"
            style={{ padding: '8px', width: '200px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={fetchAttendance} disabled={loading} style={{ padding: '8px 16px' }}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px', background: '#fee', color: '#c00', borderRadius: '5px', marginBottom: '20px' }}>
          ❌ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '2px solid #86efac' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>{onTime}</div>
          <div style={{ color: '#15803d', marginTop: '5px' }}>✅ On-Time</div>
        </div>
        <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px', border: '2px solid #fcd34d' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d97706' }}>{late}</div>
          <div style={{ color: '#b45309', marginTop: '5px' }}>⏰ Late</div>
        </div>
        <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '8px', border: '2px solid #fca5a5' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>{absent}</div>
          <div style={{ color: '#b91c1c', marginTop: '5px' }}>❌ Absent</div>
        </div>
        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '8px', border: '2px solid #cbd5e1' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#475569' }}>{filtered.length}</div>
          <div style={{ color: '#334155', marginTop: '5px' }}>📊 Total</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>UID Hash</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Time</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Consensus</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  {loading ? 'Loading attendance data...' : 'No attendance records found for this class/session'}
                </td>
              </tr>
            ) : (
              filtered.map((msg, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: getStatusColor(msg.status) + '20',
                      color: getStatusColor(msg.status),
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      display: 'inline-block'
                    }}>
                      {getStatusIcon(msg.status)} {msg.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>
                    {msg.uidHash.slice(0, 10)}...{msg.uidHash.slice(-8)}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {new Date(msg.ts).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {msg.consensusTimestamp.slice(0, 19)}...
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
        <strong style={{ color: '#0369a1' }}>🔒 Privacy Note:</strong>
        <p style={{ margin: '5px 0 0 0', color: '#075985', fontSize: '14px' }}>
          Student identities are protected. Only hashed UIDs are stored on-chain. Raw NFC card numbers never leave the device.
        </p>
      </div>
    </div>
  );
}

export default AttendanceView;
