import { useCallback } from 'react'

/**
 * Returns an onClick handler that injects a ripple wave at the cursor position.
 * Usage:
 *   const ripple = useRipple()
 *   <button className="ripple-btn" onClick={ripple}>Click me</button>
 */
export default function useRipple() {
  return useCallback((e) => {
    const btn = e.currentTarget
    const existing = btn.querySelector('.ripple-wave')
    if (existing) existing.remove()

    const rect = btn.getBoundingClientRect()
    const diameter = Math.max(btn.clientWidth, btn.clientHeight) * 2
    const radius   = diameter / 2

    const wave = document.createElement('span')
    wave.classList.add('ripple-wave')
    wave.style.width    = `${diameter}px`
    wave.style.height   = `${diameter}px`
    wave.style.left     = `${e.clientX - rect.left - radius}px`
    wave.style.top      = `${e.clientY - rect.top  - radius}px`

    btn.appendChild(wave)
    wave.addEventListener('animationend', () => wave.remove(), { once: true })
  }, [])
}
