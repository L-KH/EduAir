import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function NoiseChart({ topicId, mirrorUrl }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNoiseData = async () => {
    if (!topicId) return;

    setLoading(true);

    try {
      const url = `${mirrorUrl}/api/v1/topics/${topicId}/messages?limit=100&order=desc`;
      const response = await fetch(url);
      const result = await response.json();

      const telemetry = result.messages
        .map(msg => {
          try {
            const text = Buffer.from(msg.message, 'base64').toString('utf-8');
            const parsed = JSON.parse(text);
            if (parsed.type === 'telemetry' && parsed.sensors?.noiseDb) {
              return {
                time: new Date(parsed.ts).toLocaleTimeString(),
                noiseDb: parsed.sensors.noiseDb,
                ts: parsed.ts
              };
            }
            return null;
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)
        .reverse()
        .slice(-30); // Last 30 readings

      setData(telemetry);
    } catch (error) {
      console.error('Error fetching noise data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoiseData();
    const interval = setInterval(fetchNoiseData, 12000);
    return () => clearInterval(interval);
  }, [topicId]);

  const getNoiseLevel = (db) => {
    if (db < 50) return { label: 'Very Quiet', color: '#10b981', bg: '#d1fae5' };
    if (db < 60) return { label: 'Quiet', color: '#3b82f6', bg: '#dbeafe' };
    if (db < 70) return { label: 'Normal', color: '#f59e0b', bg: '#fef3c7' };
    if (db < 75) return { label: 'Loud', color: '#ef4444', bg: '#fee2e2' };
    return { label: 'Very Loud', color: '#dc2626', bg: '#fecaca' };
  };

  const currentNoise = data.length > 0 ? data[data.length - 1].noiseDb : null;
  const currentLevel = currentNoise ? getNoiseLevel(currentNoise) : null;
  const avgNoise = data.length > 0 
    ? (data.reduce((sum, d) => sum + d.noiseDb, 0) / data.length).toFixed(1)
    : null;

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔊 Noise Monitoring</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Real-time classroom noise levels (no audio recording)
      </p>

      {/* Current Level Card */}
      {currentLevel && (
        <div style={{ 
          background: currentLevel.bg,
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: `3px solid ${currentLevel.color}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', fontWeight: 'bold', color: currentLevel.color }}>
            {currentNoise} dB
          </div>
          <div style={{ fontSize: '24px', color: currentLevel.color, marginTop: '10px', fontWeight: '600' }}>
            {currentLevel.label}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Average: {avgNoise} dB
          </div>
        </div>
      )}

      {/* Level Guide */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: '10px',
        marginBottom: '30px'
      }}>
        <div style={{ padding: '15px', background: '#d1fae5', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#059669' }}>{'<50 dB'}</div>
          <div style={{ fontSize: '12px', color: '#047857' }}>Very Quiet</div>
        </div>
        <div style={{ padding: '15px', background: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#2563eb' }}>50-60 dB</div>
          <div style={{ fontSize: '12px', color: '#1e40af' }}>Quiet</div>
        </div>
        <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#d97706' }}>60-70 dB</div>
          <div style={{ fontSize: '12px', color: '#b45309' }}>Normal</div>
        </div>
        <div style={{ padding: '15px', background: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#dc2626' }}>70-75 dB</div>
          <div style={{ fontSize: '12px', color: '#b91c1c' }}>Loud</div>
        </div>
        <div style={{ padding: '15px', background: '#fecaca', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#991b1b' }}>{'>75 dB'}</div>
          <div style={{ fontSize: '12px', color: '#7f1d1d' }}>Very Loud</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>📊 Noise Trend (Last 30 Readings)</h3>
        {data.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            {loading ? 'Loading noise data...' : 'No noise data available yet'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="noiseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                domain={[40, 80]}
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                label={{ value: 'dB', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: '#1e293b', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <ReferenceLine y={50} stroke="#10b981" strokeDasharray="3 3" label="Quiet" />
              <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="3 3" />
              <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" label="Loud" />
              <Area 
                type="monotone" 
                dataKey="noiseDb" 
                stroke="#f59e0b" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#noiseGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
        <strong style={{ color: '#15803d' }}>🔇 Privacy Note:</strong>
        <p style={{ margin: '5px 0 0 0', color: '#166534', fontSize: '14px' }}>
          Only numeric noise levels are recorded. No audio content is captured or stored.
        </p>
      </div>
    </div>
  );
}

export default NoiseChart;
