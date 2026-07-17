import { useState } from 'react'
import PriceDropToast from '../components/PriceDropToast'
import SurgeRadar from '../components/SurgeRadar'
import PriceHeatmap from '../components/PriceHeatmap'
import LoginSplash from '../components/LoginSplash'
import { useSavingsStreak } from '../hooks/useSavingsStreak'

// Fake pulse card (same as ComparePage PulseCard)
function PulseCard({ index }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: 16, marginBottom: 10,
      border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      animation: `fare-breathe 1.8s ${index * 0.18}s ease-in-out infinite`,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F5F5F7' }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: '50%', height: 14, borderRadius: 7, background: '#F5F5F7', marginBottom: 8 }} />
          <div style={{ width: '30%', height: 11, borderRadius: 6, background: '#F5F5F7' }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            width: 60, height: 22, borderRadius: 8,
            background: 'linear-gradient(90deg,rgba(0,113,227,0.12),rgba(0,113,227,0.25),rgba(0,113,227,0.12))',
            backgroundSize: '200% 100%',
            animation: 'fare-shimmer 1.4s ease-in-out infinite',
            marginBottom: 6,
          }} />
          <div style={{ width: 40, height: 11, borderRadius: 6, background: '#F5F5F7' }} />
        </div>
      </div>
      <div style={{ width: '100%', height: 36, borderRadius: 12, background: '#F5F5F7', marginTop: 12 }} />
      <style>{`
        @keyframes fare-breathe {
          0%,100% { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
          50%      { box-shadow: 0 4px 20px rgba(0,113,227,0.14); }
        }
        @keyframes fare-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

function Section({ num, title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{
          width: 26, height: 26, borderRadius: 8,
          background: '#0071E3', color: '#fff',
          fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{num}</span>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F', margin: 0 }}>{title}</p>
      </div>
      <div style={{ background: '#F5F5F7', borderRadius: 20, padding: 20 }}>
        {children}
      </div>
    </div>
  )
}

export default function FeatureDemoPage() {
  const [showToast, setShowToast]   = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const { streak, justBumped, recordSaving } = useSavingsStreak()

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 80px', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#6E6E73', textTransform: 'uppercase', marginBottom: 4 }}>
        Feature Check
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: '#1D1D1F', margin: '0 0 24px' }}>
        All 5 Features
      </h1>

      {/* 1 — Live Fare Pulse */}
      <Section num="1" title="Live fare pulse — loading state">
        <p style={{ fontSize: 12, color: '#6E6E73', margin: '0 0 12px' }}>
          Cards breathe with a blue glow + shimmer while fares are fetching
        </p>
        {[0, 1, 2].map(i => <PulseCard key={i} index={i} />)}
      </Section>

      {/* 2 — Price Drop Toast */}
      <Section num="2" title="Price drop toast">
        <p style={{ fontSize: 12, color: '#6E6E73', margin: '0 0 12px' }}>
          Slides in from top when auto-refresh detects a fare drop ≥8%
        </p>
        <button
          onClick={() => setShowToast(true)}
          style={{
            background: '#0071E3', color: '#fff', border: 'none',
            borderRadius: 980, padding: '10px 20px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Trigger toast demo
        </button>
        {showToast && (
          <PriceDropToast
            provider="Ola"
            oldFare={320}
            newFare={247}
            onDismiss={() => setShowToast(false)}
            onBook={() => setShowToast(false)}
          />
        )}
      </Section>

      {/* 3 — Surge Radar */}
      <Section num="3" title="Surge radar">
        <p style={{ fontSize: 12, color: '#6E6E73', margin: '0 0 12px' }}>
          Shows above results when any provider is surging
        </p>
        <SurgeRadar providerName="Uber, Rapido" />
      </Section>

      {/* 4 — Price Heatmap */}
      <Section num="4" title="Price heatmap — best time to ride">
        <p style={{ fontSize: 12, color: '#6E6E73', margin: '0 0 12px' }}>
          7×24 grid — hover a cell to see estimated fare. Blue = right now.
        </p>
        <PriceHeatmap basefare={220} />
      </Section>

      {/* 5 — Savings Streak */}
      <Section num="5" title="Savings streak">
        <p style={{ fontSize: 12, color: '#6E6E73', margin: '0 0 12px' }}>
          Tracks consecutive days you saved money. Stored in localStorage.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {streak > 0 ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: justBumped ? '#FFF3CD' : '#FFF8EB',
              border: '1px solid rgba(255,159,10,0.35)',
              borderRadius: 980, padding: '7px 14px',
              fontSize: 13, fontWeight: 600, color: '#92400E',
              animation: justBumped ? 'streak-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
            }}>
              🔥 {streak}-day saving streak
            </div>
          ) : (
            <span style={{ fontSize: 13, color: '#6E6E73' }}>No streak yet — click below to start one</span>
          )}
          <button
            onClick={recordSaving}
            style={{
              background: 'rgba(0,113,227,0.1)', color: '#0071E3',
              border: '1px solid rgba(0,113,227,0.25)',
              borderRadius: 980, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Simulate saving today
          </button>
        </div>
        <style>{`
          @keyframes streak-pop {
            from { transform: scale(0.8); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }
        `}</style>
      </Section>

      {/* 6 — Login Splash (bonus) */}
      <Section num="✦" title="Login splash (bonus)">
        <p style={{ fontSize: 12, color: '#6E6E73', margin: '0 0 12px' }}>
          Plays after successful login — slides up after 2s
        </p>
        <button
          onClick={() => setShowSplash(true)}
          style={{
            background: '#1D1D1F', color: '#fff', border: 'none',
            borderRadius: 980, padding: '10px 20px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Play splash
        </button>
        {showSplash && (
          <LoginSplash name="Divyanshu" onDone={() => setShowSplash(false)} />
        )}
      </Section>
    </div>
  )
}
