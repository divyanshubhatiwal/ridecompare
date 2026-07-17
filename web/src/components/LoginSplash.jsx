import { useEffect, useState } from 'react'

/**
 * Full-screen brand splash shown after a successful login.
 * Props:
 *   name     – user's first name
 *   onDone   – callback fired when animation finishes
 */
export default function LoginSplash({ name, onDone }) {
  const [phase, setPhase] = useState('enter') // enter → hold → exit

  useEffect(() => {
    // hold for 1.8s then start exit slide-up
    const t1 = setTimeout(() => setPhase('exit'), 1800)
    // call onDone a beat after exit animation starts
    const t2 = setTimeout(() => onDone?.(), 2450)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className="splash-root"
      style={{ '--phase': phase === 'exit' ? 1 : 0 }}
      data-phase={phase}
    >
      {/* Background */}
      <div className="splash-bg" />

      {/* Centre content */}
      <div className="splash-body">

        {/* Icon with pulse rings */}
        <div className="splash-icon-wrap">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="splash-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              width="32" height="32">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <p className="splash-brand">
          Ride<span>Compare</span>
        </p>

        {/* Welcome line */}
        <p className="splash-welcome">
          Welcome back, {name || 'there'} 👋
        </p>

        {/* Progress bar */}
        <div className="splash-bar-track">
          <div className="splash-bar-fill" />
        </div>
      </div>

      <style>{`
        /* ── Root ─────────────────────────────────── */
        .splash-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          /* exit: slide up + fade */
          transition: transform 0.6s cubic-bezier(0.76,0,0.24,1),
                      opacity 0.55s ease;
        }
        .splash-root[data-phase="exit"] {
          transform: translateY(-100%);
          opacity: 0;
        }

        /* ── Background ───────────────────────────── */
        .splash-bg {
          position: absolute;
          inset: 0;
          background: #000;
        }

        /* ── Body ─────────────────────────────────── */
        .splash-body {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          animation: splash-body-in 0.7s cubic-bezier(0.34,1.4,0.64,1) both;
        }
        @keyframes splash-body-in {
          from { opacity: 0; transform: scale(0.82) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }

        /* ── Icon ─────────────────────────────────── */
        .splash-icon-wrap {
          position: relative;
          width: 88px;
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }
        .splash-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: #0071E3;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 0 40px rgba(0,113,227,0.55), 0 0 80px rgba(0,113,227,0.25);
          animation: icon-pop 0.55s 0.15s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes icon-pop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }

        /* pulse rings */
        .ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid rgba(0,113,227,0.35);
          animation: ring-expand 2.2s ease-out infinite;
        }
        .ring-2 { animation-delay: 1.1s; }
        @keyframes ring-expand {
          0%   { transform: scale(0.72); opacity: 0.8; }
          100% { transform: scale(1.55); opacity: 0;   }
        }

        /* ── Brand ────────────────────────────────── */
        .splash-brand {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #fff;
          line-height: 1;
          animation: splash-text-in 0.5s 0.3s ease both;
        }
        .splash-brand span { color: #0071E3; }

        @keyframes splash-text-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }

        /* ── Welcome ──────────────────────────────── */
        .splash-welcome {
          margin-top: 10px;
          font-size: 14px;
          font-weight: 400;
          color: #86868B;
          letter-spacing: -0.01em;
          animation: splash-text-in 0.5s 0.48s ease both;
        }

        /* ── Progress bar ─────────────────────────── */
        .splash-bar-track {
          margin-top: 40px;
          width: 120px;
          height: 2px;
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
          overflow: hidden;
          animation: splash-text-in 0.4s 0.6s ease both;
        }
        .splash-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: #0071E3;
          animation: bar-fill 1.6s 0.65s cubic-bezier(0.4,0,0.2,1) forwards;
          width: 0%;
        }
        @keyframes bar-fill {
          from { width: 0%;   }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
