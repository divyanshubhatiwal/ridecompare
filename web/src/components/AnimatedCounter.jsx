import { useState, useEffect, useRef } from 'react'

/**
 * Counts up from 0 to `value` over `duration` ms.
 * `prefix` / `suffix` are appended as plain strings.
 * Re-triggers whenever `value` changes.
 */
export default function AnimatedCounter({
  value       = 0,
  duration    = 900,
  prefix      = '',
  suffix      = '',
  className   = '',
  decimals    = 0,
}) {
  const [display, setDisplay] = useState(0)
  const rafRef   = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    const target = Number(value)
    if (isNaN(target)) return

    cancelAnimationFrame(rafRef.current)
    startRef.current = null

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed  = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3)
      setDisplay(target * eased)
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
      else              setDisplay(target)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.floor(display).toLocaleString('en-IN')

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
