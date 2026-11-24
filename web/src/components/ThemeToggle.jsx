import { Moon, Sun } from 'lucide-react'
import { flushSync } from 'react-dom'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()

  const onClick = (e) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce) { toggle(); return }

    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    const vt = document.startViewTransition(() => {
      flushSync(toggle)
      document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark')
    })
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 550, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
  }

  return (
    <button
      onClick={onClick}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`pressable w-9 h-9 rounded-full flex items-center justify-center t-primary ${className}`}
      style={{ background: 'var(--tint)' }}
    >
      <span key={theme} className="inline-flex" style={{ animation: 'theme-icon .5s cubic-bezier(.34,1.56,.64,1)' }}>
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </span>
      <style>{`@keyframes theme-icon { from { transform: rotate(-90deg) scale(.4); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
    </button>
  )
}
