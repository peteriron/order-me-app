import { useEffect, useState } from 'react'
import { msUntilNextDay } from './history.ts'

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/**
 * Today's date, kept current: History's "Today" and "Yesterday" move on at midnight while the app stays open. A
 * timer fires at midnight, and coming back to the app checks again, since a sleeping phone pauses timers.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    const refresh = () => setToday((current) => (sameDay(current, new Date()) ? current : new Date()))
    // Rescheduled with each new day; the extra second keeps it clear of midnight itself.
    const timer = window.setTimeout(refresh, msUntilNextDay(today) + 1000)
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [today])

  return today
}
