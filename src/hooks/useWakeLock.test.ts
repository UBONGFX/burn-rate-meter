// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from './useWakeLock'

type FakeSentinel = { released: boolean; release: () => Promise<void> }
let sentinels: FakeSentinel[]
let visibility: DocumentVisibilityState

beforeEach(() => {
  sentinels = []
  visibility = 'visible'
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: {
      request: vi.fn(async () => {
        const sentinel: FakeSentinel = { released: false, release: async () => void (sentinel.released = true) }
        sentinels.push(sentinel)
        return sentinel
      }),
    },
  })
})

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock')
})

const active = () => sentinels.filter((s) => !s.released).length

describe('useWakeLock', () => {
  it('keeps the screen on while active and lets it go when inactive', async () => {
    const { rerender, unmount } = renderHook(({ on }) => useWakeLock(on), { initialProps: { on: true } })
    await waitFor(() => expect(active()).toBe(1))

    rerender({ on: false })
    await waitFor(() => expect(active()).toBe(0))

    rerender({ on: true })
    await waitFor(() => expect(active()).toBe(1))
    unmount()
    await waitFor(() => expect(active()).toBe(0))
  })

  it('requests the lock again when the tab comes back', async () => {
    renderHook(() => useWakeLock(true))
    await waitFor(() => expect(active()).toBe(1))

    // The browser releases the lock while the tab is hidden
    visibility = 'hidden'
    sentinels[0].released = true
    document.dispatchEvent(new Event('visibilitychange'))
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(1)

    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(active()).toBe(1))
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(2)
  })

  it('does nothing when inactive or unsupported', () => {
    renderHook(() => useWakeLock(false))
    expect(navigator.wakeLock.request).not.toHaveBeenCalled()

    Reflect.deleteProperty(navigator, 'wakeLock')
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
  })
})
