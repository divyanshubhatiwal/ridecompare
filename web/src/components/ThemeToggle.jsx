import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-xl border border-border hover:border-primary/40 transition-all text-muted hover:text-white hover:scale-110 active:scale-95 ${className}`}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      <span style={{ display: 'inline-block', transition: 'transform 0.4s ease', transform: theme === 'light' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </span>
    </button>
  )
}
