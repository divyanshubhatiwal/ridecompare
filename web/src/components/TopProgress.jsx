import { useEffect, useRef, useState } from 'react'
import { onRequestsChange } from '../api/client'

const SHOW_AFTER_MS = 150
const SLOW_AFTER_MS = 5000

export default function TopProgress() {
  const [phase, setPhase] = useState('idle') // idle | loading | done
  const [slow, setSlow]   = useState(false)
  const timers = useRef({})

  useEffect(() => {
    const t = timers.current
    const off = onRequestsChange(count => {
      if (count > 0) {
        clearTimeout(t.hide)
        if (!t.show && !t.active) {
          t.show = setTimeout(() => { t.active = true; t.show = null; setPhase('loading') }, SHOW_AFTER_MS)
          t.slow = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
        }
      } else {
        clearTimeout(t.show); clearTimeout(t.slow); t.show = null
        setSlow(false)
        if (t.active) {
          t.active = false
          setPhase('done')
          t.hide = setTimeout(() => setPhase('idle'), 400)
        }
      }
    })
    return () => { off(); Object.values(t).forEach(clearTimeout) }
  }, [])

  return (
    <>
      {phase !== 'idle' && (
        <div className={`top-progress ${phase === 'done' ? 'done' : ''}`} role="progressbar" aria-label="Loading">
          <span key={phase === 'loading' ? 'l' : 'd'} />
        </div>
      )}
      {slow && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[100000] glass rounded-full px-4 py-2 text-[12px] font-medium t-primary flex items-center gap-2 fade-up"
          style={{ top: 'calc(env(safe-area-inset-top) + 64px)' }} role="status">
          <span className="live-dot" style={{ background: '#F59E0B' }} />
          Waking up the server — this can take up to a minute…
        </div>
      )}
    </>
  )
}
