/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // These four use CSS variables so light/dark theme works automatically
        bg:      'rgb(var(--c-bg)      / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        card:    'rgb(var(--c-card)    / <alpha-value>)',
        border:  'rgb(var(--c-border)  / <alpha-value>)',
        muted:   'rgb(var(--c-muted)   / <alpha-value>)',
        // Fixed accent colours
        primary:   '#6366F1',
        accent:    '#8B5CF6',
        surge:     '#F43F5E',
        cheapest:  '#10B981',
        fastest:   '#3B82F6',
        bestvalue: '#F59E0B',
        warning:   '#F59E0B',
        error:     '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'slide-up':   'slide-up 0.3s ease-out',
        'fade-in':    'fade-in 0.2s ease-out',
        'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
