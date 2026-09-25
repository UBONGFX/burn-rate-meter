import { useCallback, useEffect, useRef, useState } from 'react'

export type TimerStatus = 'running' | 'paused' | 'ended'

/**
 * Elapsed meeting time. Time is derived from performance.now() deltas that are
 * accumulated across pauses, so throttled background tabs never lose seconds.
 */
export function useMeetingTimer() {
  const [status, setStatus] = useState<TimerStatus>('running')
  const [elapsedMs, setElapsedMs] = useState(0)
  const accumulatedMs = useRef(0)
  const runningSince = useRef<number | null>(null)

  const now = useCallback(
    () => accumulatedMs.current + (runningSince.current === null ? 0 : performance.now() - runningSince.current),
    [],
  )

  useEffect(() => {
    if (status !== 'running') return
    runningSince.current = performance.now()
    let frame = requestAnimationFrame(function tick() {
      setElapsedMs(now())
      frame = requestAnimationFrame(tick)
    })
    return () => {
      cancelAnimationFrame(frame)
      accumulatedMs.current = now()
      runningSince.current = null
      setElapsedMs(accumulatedMs.current)
    }
  }, [status, now])

  const pause = useCallback(() => setStatus((s) => (s === 'running' ? 'paused' : s)), [])
  const resume = useCallback(() => setStatus((s) => (s === 'paused' ? 'running' : s)), [])
  const stop = useCallback(() => setStatus('ended'), [])

  return { status, elapsedMs, now, pause, resume, stop }
}
