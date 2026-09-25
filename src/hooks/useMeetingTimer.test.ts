// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMeetingTimer } from './useMeetingTimer'

// Fake clock: performance.now() and requestAnimationFrame (~16 ms frames) advance together.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout'] })
})

afterEach(() => {
  vi.useRealTimers()
})

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function renderTimer() {
  // Strict mode runs effects twice; the timer must not double-count because of it.
  return renderHook(() => useMeetingTimer(), { reactStrictMode: true })
}

describe('useMeetingTimer', () => {
  it('starts running at zero', () => {
    const { result } = renderTimer()
    expect(result.current.status).toBe('running')
    expect(result.current.elapsedMs).toBe(0)
  })

  it('counts time while running, updated every frame', () => {
    const { result } = renderTimer()
    advance(1000)
    // The rendered value lags at most one frame behind the clock.
    expect(result.current.elapsedMs).toBeGreaterThan(1000 - 17)
    expect(result.current.elapsedMs).toBeLessThanOrEqual(1000)
  })

  it('now() is exact between frames', () => {
    const { result } = renderTimer()
    advance(1234)
    expect(result.current.now()).toBe(1234)
  })

  it('does not count paused time', () => {
    const { result } = renderTimer()
    advance(1000)
    act(() => result.current.pause())
    expect(result.current.status).toBe('paused')
    expect(result.current.elapsedMs).toBe(1000)

    advance(5000)
    expect(result.current.elapsedMs).toBe(1000)
    expect(result.current.now()).toBe(1000)
  })

  it('continues from the paused time after resume', () => {
    const { result } = renderTimer()
    advance(1000)
    act(() => result.current.pause())
    advance(5000)
    act(() => result.current.resume())
    expect(result.current.status).toBe('running')

    advance(2000)
    expect(result.current.now()).toBe(3000)
  })

  it('accumulates exactly across several pause/resume cycles', () => {
    const { result } = renderTimer()
    for (let i = 0; i < 5; i++) {
      advance(777)
      act(() => result.current.pause())
      advance(10_000)
      act(() => result.current.resume())
    }
    expect(result.current.now()).toBe(5 * 777)
  })

  it('freezes the time when stopped, and cannot be resumed', () => {
    const { result } = renderTimer()
    advance(3000)
    act(() => result.current.stop())
    expect(result.current.status).toBe('ended')
    expect(result.current.elapsedMs).toBe(3000)

    act(() => result.current.resume())
    advance(5000)
    expect(result.current.status).toBe('ended')
    expect(result.current.elapsedMs).toBe(3000)
  })

  it('can be stopped while paused', () => {
    const { result } = renderTimer()
    advance(2000)
    act(() => result.current.pause())
    advance(1000)
    act(() => result.current.stop())
    expect(result.current.status).toBe('ended')
    expect(result.current.elapsedMs).toBe(2000)
  })

  it('stops requesting frames after unmount', () => {
    const { unmount } = renderTimer()
    advance(100)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
