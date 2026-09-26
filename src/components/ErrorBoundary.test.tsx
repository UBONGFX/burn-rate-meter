// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SETTINGS_KEY } from '../lib/settings'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

beforeEach(() => {
  // React and the boundary log the (expected) error
  vi.spyOn(console, 'error').mockImplementation(() => {})
  Object.defineProperty(navigator, 'languages', { value: ['de-DE'], configurable: true })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('ErrorBoundary', () => {
  it('renders the children while nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>alles gut</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('alles gut')).toBeTruthy()
  })

  it('shows a friendly page instead of a blank screen', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Da ist etwas angebrannt')).toBeTruthy()
  })

  it('can reload, or reset the stored settings and reload', () => {
    localStorage.setItem(SETTINGS_KEY, '{"version":3,"settings":{}}')
    const onReload = vi.fn()
    render(
      <ErrorBoundary onReload={onReload}>
        <Boom />
      </ErrorBoundary>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Neu laden' }))
    expect(onReload).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(SETTINGS_KEY)).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Einstellungen zurücksetzen' }))
    expect(onReload).toHaveBeenCalledTimes(2)
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull()
  })
})
