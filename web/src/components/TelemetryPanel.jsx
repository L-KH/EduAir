import React, { useState, useEffect } from 'react';

function TelemetryPanel({ topicId, mirrorUrl }) {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLatest = async () => {
    if (!topicId) return;

    setLoading(true);

    try {
      const url = `${mirrorUrl}/api/v1/topics/${topicId}/messages?limit=20&order=desc`;
      const response = await fetch(url);
      const result = await response.json();

      // Find most recent telemetry message
      for (const msg of result.messages) {
        try {
          const text = Buffer.from(msg.message, 'base64').toString('utf-8');
          const parsed = JSON.parse(text);
          if (parsed.type === 'telemetry' && parsed.sensors) {
            setLatest(parsed);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 10000);
    return () => clearInterval(interval);
  }, [topicId]);

  const getSensorStatus = (key, value) => {
    switch (key) {
      case 'tempC':
        if (value < 18) return { status: 'cold', color: '#3b82f6' };
        if (value < 22) return { status: 'cool', color: '#10b981' };
        if (value < 26) return { status: 'comfortable', color: '#22c55e' };
        if (value < 28) return { status: 'warm', color: '#f59e0b' };
        return { status: 'hot', color: '#ef4444' };

      case 'humPct':
        if (value < 30) return { status: 'dry', color: '#f59e0b' };
        if (value < 60) return { status: 'comfortable', color: '#22c55e' };
        return { status: 'humid', color: '#3b82f6' };

      case 'co2ppm':
        if (value < 600) return { status: 'excellent', color: '#22c55e' };
        if (value < 800) return { status: 'good', color: '#3b82f6' };
        if (value < 1000) return { status: 'fair', color: '#f59e0b' };
        return { status: 'poor', color: '#ef4444' };

      case 'pm25':
        if (value < 12) return { status: 'good', color: '#22c55e' };
        if (value < 35) return { status: 'moderate', color: '#f59e0b' };
        return { status: 'unhealthy', color: '#ef4444' };

      case 'lightLux':
        if (value < 200) return { status: 'dim', color: '#64748b' };
        if (value < 400) return { status: 'adequate', color: '#3b82f6' };
        return { status: 'bright', color: '#22c55e' };

      default:
        return { status: 'ok', color: '#64748b' };
    }
  };

  const sensors = [
    { key: 'tempC', label: 'Temperature', icon: '🌡️', unit: '°C' },
    { key: 'humPct', label: 'Humidity', icon: '💧', unit: '%' },
    { key: 'co2ppm', label: 'CO₂', icon: '🫁', unit: 'ppm' },
    { key: 'pm25', label: 'PM2.5', icon: '💨', unit: 'µg/m³' },
    { key: 'noiseDb', label: 'Noise', icon: '🔊', unit: 'dB' },
    { key: 'lightLux', label: 'Light', icon: '💡', unit: 'lux' }
  ];

  if (!latest && !loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
        <p>No telemetry data available yet</p>
        <p style={{ fontSize: '14px' }}>Start the simulator to see live metrics</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📊 Environmental Metrics</h2>
        {latest && (
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Updated: {new Date(latest.ts).toLocaleTimeString()}
          </div>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px'
      }}>
        {sensors.map(sensor => {
          const value = latest?.sensors[sensor.key];
          const status = value ? getSensorStatus(sensor.key, value) : null;

          return (
            <div
              key={sensor.key}
              style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: status ? `3px solid ${status.color}` : '3px solid #e2e8f0',
                transition: 'all 0.3s'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{sensor.icon}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '5px' }}>
                {sensor.label}
              </div>
              {value !== undefined ? (
                <>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: status.color, marginBottom: '5px' }}>
                    {typeof value === 'number' ? value.toFixed(1) : value}
                    <span style={{ fontSize: '18px', marginLeft: '5px' }}>{sensor.unit}</span>
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: status.color, 
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {status.status}
                  </div>
                </>
              ) : (
                <div style={{ color: '#94a3b8' }}>—</div>
              )}
            </div>
          );
        })}
      </div>

      {latest && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#475569' }}>
          <div><strong>Class:</strong> {latest.classId || 'N/A'}</div>
          <div><strong>Session:</strong> {latest.session || 'N/A'}</div>
          <div><strong>Device:</strong> {latest.deviceId || 'N/A'}</div>
        </div>
      )}
    </div>
  );
}

export default TelemetryPanel;
