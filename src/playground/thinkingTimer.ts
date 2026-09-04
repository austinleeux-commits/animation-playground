import { useEffect, useRef, useState } from 'react'

/** "29s" under a minute, "2m 14s" past it — the format the card labels a step with. */
export function formatElapsed(seconds: number): string {
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

/**
 * Seconds since mount — the pill's thinking timer, counting for as long as the
 * request is still being worked on. `running` only gates the re-render, not the
 * clock: the elapsed time is read back off a timestamp, so a timer that was
 * parked while the card was expanded resumes at the right number rather than
 * where it left off.
 */
export function useElapsedSeconds(running: boolean): number {
  const startedAt = useRef(0)
  const [seconds, setSeconds] = useState(0)

  /* Reading the clock is a side effect, so the start stamp is taken on mount
     rather than during the first render. */
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  useEffect(() => {
    if (!running) return
    const tick = () => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [running])

  return seconds
}
