// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '../lib/settings'
import { useSettings } from './useSettings'

beforeEach(() => {
  localStorage.clear()
})

describe('useSettings', () => {
  it('does not store untouched defaults, so later defaults still apply', () => {
    const { result } = renderHook(() => useSettings(), { reactStrictMode: true })
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull()
  })

  it('stores settings once the user changes something', () => {
    const { result } = renderHook(() => useSettings())
    act(() => result.current.setSettings((s) => ({ ...s, billValue: 20 })))
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!).settings.billValue).toBe(20)
  })

  it('reset forgets the stored settings instead of saving the current defaults', () => {
    const { result } = renderHook(() => useSettings())
    act(() => result.current.setSettings((s) => ({ ...s, billValue: 20 })))
    act(() => result.current.resetSettings())
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull()
  })

  it('takes over changes from another tab without writing them back', () => {
    const { result } = renderHook(() => useSettings(), { reactStrictMode: true })
    // Written by another tab (with unusual formatting, to detect a write-back)
    const fromOtherTab = JSON.stringify({ version: 3, settings: { ...DEFAULT_SETTINGS, billValue: 50 } }, null, 2)
    localStorage.setItem(SETTINGS_KEY, fromOtherTab)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: SETTINGS_KEY, newValue: fromOtherTab }))
    })
    expect(result.current.settings.billValue).toBe(50)
    expect(localStorage.getItem(SETTINGS_KEY)).toBe(fromOtherTab)
  })

  it('follows a reset in another tab', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: 3, settings: { ...DEFAULT_SETTINGS, billValue: 50 } }))
    const { result } = renderHook(() => useSettings())
    expect(result.current.settings.billValue).toBe(50)
    localStorage.removeItem(SETTINGS_KEY)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: SETTINGS_KEY, newValue: null }))
    })
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
  })
})
