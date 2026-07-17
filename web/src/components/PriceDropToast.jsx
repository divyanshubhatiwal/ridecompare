import { useEffect, useState } from 'react'
import { TrendingDown, X } from 'lucide-react'

/**
 * Spring-bouncy toast that slides down from top.
 * Props:
 *   provider   – provider name e.g. "Ola"
 *   oldFare    – previous fare number
 *   newFare    – new lower fare number
 *   onDismiss  – callback to hide
 *   onBook     – callback when user taps "Book now"
 */
export default function PriceDropToast({ provider, oldFare, newFare, onDismiss, onBook }) {
  const [visible, setVisible] = useState(false)
  const saved = Math.round(oldFare - newFare)

  useEffect(() => {
    // tiny delay so the enter animation plays
    const t = setTimeout(() => setVisible(true), 30)
    // auto-dismiss after 6 s
    const t2 = setTimeout(() => handleDismiss(), 6000)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss?.(), 400)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 70,
        left: '50%',
        transform: visible
          ? 'translateX(-50%) translateY(0) scale(1)'
          : 'translateX(-50%) translateY(-120%) scale(0.9)',
        transition: visible
          ? 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)'
          : 'transform 0.35s cubic-bezier(0.6,0,1,1)',
        zIndex: 9998,
        width: 'calc(100% - 32px)',
        maxWidth: 380,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.07)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 14,
          background: '#EDFBF2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <TrendingDown size={20} color="#30D158" />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', margin: 0, lineHeight: 1.3 }}>
            {provider} dropped to{' '}
            <span style={{ color: '#30D158' }}>₹{Math.round(newFare)}</span>
          </p>
          <p style={{ fontSize: 11, color: '#6E6E73', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ textDecoration: 'line-through' }}>₹{Math.round(oldFare)}</span>
            <span style={{ color: '#30D158', fontWeight: 600 }}>Save ₹{saved}</span>
          </p>
        </div>

        {/* Book CTA */}
        <button
          onClick={() => { handleDismiss(); onBook?.() }}
          style={{
            background: '#0071E3',
            color: '#fff',
            border: 'none',
            borderRadius: 980,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Book
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#6E6E73', flexShrink: 0 }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
