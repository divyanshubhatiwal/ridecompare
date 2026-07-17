/**
 * Surge radar — sonar rings that pulse outward from a center dot.
 * Shows when any provider in the results is surging.
 */
export default function SurgeRadar({ providerName }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(255,59,48,0.06)',
      border: '1px solid rgba(255,59,48,0.18)',
      borderRadius: 16, padding: '12px 16px',
      marginBottom: 12,
    }}>
      {/* Radar icon */}
      <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1.5px solid rgba(255,59,48,0.5)',
            animation: `radar-ring 2s ${i * 0.65}s ease-out infinite`,
          }} />
        ))}
        <span style={{
          position: 'absolute', inset: '30%',
          borderRadius: '50%',
          background: '#FF3B30',
          boxShadow: '0 0 8px rgba(255,59,48,0.6)',
        }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#FF3B30', margin: 0 }}>
          Surge detected{providerName ? ` · ${providerName}` : ''}
        </p>
        <p style={{ fontSize: 11, color: '#6E6E73', margin: '2px 0 0' }}>
          Walk 200m or wait 10 min — prices may drop
        </p>
      </div>

      <style>{`
        @keyframes radar-ring {
          0%   { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
