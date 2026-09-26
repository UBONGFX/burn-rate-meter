import { useEffect } from 'react'

/**
 * Keeps the screen on while `active` (e.g. while a meeting runs), where the
 * browser supports the Screen Wake Lock API. The browser drops the lock when
 * the tab is hidden, so it is requested again when the tab comes back.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let lock: WakeLockSentinel | null = null
    let released = false

    const request = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        // Cleanup may have run while the request was pending
        if (released) void sentinel.release()
        else lock = sentinel
      } catch {
        // Denied (e.g. battery saver) – the meter works without it
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void lock?.release()
    }
  }, [active])
}
