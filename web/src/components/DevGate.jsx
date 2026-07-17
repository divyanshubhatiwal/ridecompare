import { useState, useEffect } from 'react'

const PIN = import.meta.env.VITE_DEV_PIN || '1234'
const KEY = 'rc_dev_access'

export default function DevGate({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [input,    setInput]    = useState('')
  const [shake,    setShake]    = useState(false)
  const [dots,     setDots]     = useState([])

  useEffect(() => {
    if (sessionStorage.getItem(KEY) === 'yes') setUnlocked(true)
  }, [])

  const press = (d) => {
    if (dots.length >= 4) return
    const next = [...dots, d]
    setDots(next)
    if (next.length === 4) {
      const entered = next.join('')
      if (entered === PIN) {
        sessionStorage.setItem(KEY, 'yes')
        setTimeout(() => setUnlocked(true), 300)
      } else {
        setShake(true)
        setTimeout(() => { setDots([]); setShake(false) }, 600)
      }
    }
  }

  const del = () => setDots(d => d.slice(0, -1))

  if (unlocked) return children

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
      userSelect: 'none',
    }}>
      {/* Logo */}
      <div style={{
        width: 60, height: 60, borderRadius: 18,
        background: '#0071E3',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        boxShadow: '0 0 32px rgba(0,113,227,0.5)',
      }}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>

      <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', margin: '0 0 6px' }}>
        RideCompare
      </p>
      <p style={{ fontSize: 13, color: '#6E6E73', margin: '0 0 36px' }}>Enter access PIN</p>

      {/* Dots */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 40,
        animation: shake ? 'shake 0.5s ease' : 'none',
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: dots[i] !== undefined ? '#0071E3' : 'rgba(255,255,255,0.2)',
            transition: 'background 0.15s',
            boxShadow: dots[i] !== undefined ? '0 0 10px rgba(0,113,227,0.6)' : 'none',
          }} />
        ))}
      </div>

      {/* Keypad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: 12 }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
          <button key={i}
            onClick={() => k === '⌫' ? del() : k !== '' ? press(String(k)) : null}
            style={{
              width: 72, height: 72,
              borderRadius: '50%',
              border: 'none',
              background: k === '' ? 'transparent' : k === '⌫' ? 'transparent' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: k === '⌫' ? 22 : 28,
              fontWeight: 300,
              cursor: k === '' ? 'default' : 'pointer',
              transition: 'background 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseDown={e => { if (k !== '') e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
            onMouseUp={e   => { e.currentTarget.style.background = k === '' || k === '⌫' ? 'transparent' : 'rgba(255,255,255,0.1)' }}
          >
            {k}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-10px); }
          40%      { transform: translateX(10px); }
          60%      { transform: translateX(-8px); }
          80%      { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
