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
})
