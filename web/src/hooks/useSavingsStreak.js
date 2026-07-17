import { useState, useEffect } from 'react'

const KEY_STREAK = 'rc_savings_streak'
const KEY_LAST   = 'rc_streak_last_date'
const KEY_BEST   = 'rc_streak_best'

/**
 * Returns { streak, best, recordSaving }
 * recordSaving() — call once per session when user picks a cheaper ride
 */
export function useSavingsStreak() {
  const [streak, setStreak] = useState(0)
  const [best,   setBest]   = useState(0)
  const [justBumped, setJustBumped] = useState(false)

  useEffect(() => {
    const today    = new Date().toDateString()
    const lastDate = localStorage.getItem(KEY_LAST)
    let   cur      = parseInt(localStorage.getItem(KEY_STREAK) || '0', 10)
    const bestSaved = parseInt(localStorage.getItem(KEY_BEST) || '0', 10)

    if (!lastDate) {
      // brand new user
      setStreak(0)
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (lastDate === today) {
        setStreak(cur)
      } else if (lastDate === yesterday.toDateString()) {
        setStreak(cur) // still alive, will bump on next saving
      } else {
        // streak broken
        localStorage.setItem(KEY_STREAK, '0')
        setStreak(0)
      }
    }
    setBest(bestSaved)
  }, [])

  const recordSaving = () => {
    const today    = new Date().toDateString()
    const lastDate = localStorage.getItem(KEY_LAST)
    let   cur      = parseInt(localStorage.getItem(KEY_STREAK) || '0', 10)

    if (lastDate !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      cur = lastDate === yesterday.toDateString() ? cur + 1 : 1
      localStorage.setItem(KEY_STREAK, String(cur))
      localStorage.setItem(KEY_LAST,   today)
      setStreak(cur)

      const bestSaved = parseInt(localStorage.getItem(KEY_BEST) || '0', 10)
      if (cur > bestSaved) {
        localStorage.setItem(KEY_BEST, String(cur))
        setBest(cur)
      }
      setJustBumped(true)
      setTimeout(() => setJustBumped(false), 2000)
    }
  }

  return { streak, best, justBumped, recordSaving }
}
