import { expect, test, type Page } from '@playwright/test'

/** Reads the big counter as a number, e.g. "1,23 €" → 1.23 (German locale). */
async function readCounter(page: Page): Promise<number> {
  const text = await page.getByTestId('meter-total').innerText()
  return Number(text.replace(/[^\d,]/g, '').replace(',', '.'))
}

test('runs a meeting: counts, pauses, changes headcount and ends', async ({ page }) => {
  // Fake clock (Date, timers, performance.now, requestAnimationFrame), paused so that time
  // only moves with runFor() and never with the real time Playwright spends between actions.
  await page.clock.install({ time: new Date('2026-01-01T09:00:00') })
  // Motion runs opacity animations on the Web Animations API, whose document.timeline
  // the fake clock does not advance, so exit animations would never finish. Without
  // Element.animate, Motion falls back to requestAnimationFrame, which the clock controls.
  await page.addInitScript(() => {
    delete (Element.prototype as Partial<Element>).animate
  })
  await page.goto('/')
  await page.clock.pauseAt(new Date('2026-01-01T09:00:01'))

  // Teammeeting preset: 6 × Developer (50) + 1 × Product Owner (55) + 1 × Scrum Master (50) = 405 €/h
  await page.getByRole('button', { name: /Teammeeting/ }).click()
  await expect(page.getByTestId('price-per-minute')).toHaveText('6,75 €')
  await page.getByRole('button', { name: 'Meeting starten' }).click()
  await page.clock.runFor(1000) // page transition
  await expect(page.getByTestId('meter-total')).toBeVisible()

  // 6 seconds at 405 €/h = 0,675 €
  const start = await readCounter(page)
  await page.clock.runFor(6000)
  await page.getByRole('button', { name: /Pause/ }).click()
  // Let the pause settle: the timer replaces the last frame's value with the exact time.
  await page.clock.runFor(100)
  const afterRunning = await readCounter(page)
  expect(afterRunning - start).toBeCloseTo(405 / 600, 1)

  // Paused time costs nothing (meanwhile, open the collapsed attendee panel)
  await page.getByRole('button', { name: /anpassen/i }).click()
  await page.clock.runFor(30_000)
  expect(await readCounter(page)).toBe(afterRunning)

  // A second product owner joins: only the future gets more expensive (460 €/h)
  await page.getByRole('button', { name: /Weiter/ }).click()
  await page.getByLabel('Product Owner · 55 €/h', { exact: true }).fill('2')
  await page.clock.runFor(6000)
  await page.getByRole('button', { name: /Beenden/ }).click()
  await page.clock.runFor(100)
  const total = await readCounter(page)
  expect(total - afterRunning).toBeCloseTo(460 / 600, 1)

  // Summary (under 3,50 € there is no comparison yet)
  await page.clock.runFor(1000)
  await expect(page.getByTestId('meter-people')).toHaveText('9')
  await expect(page.getByTestId('summary').getByTestId('attendee-chip')).toHaveText(['6 Developer', '2 Product Owner', '1 Scrum Master'])
  await expect(page.getByText('Nicht mal ein Kaffee')).toBeVisible()

  // "Nochmal gleich" starts over at zero
  await page.getByRole('button', { name: 'Nochmal gleich' }).click()
  await page.clock.runFor(1000)
  await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible()
  expect(await readCounter(page)).toBeLessThan(0.2)
})

test.describe('language', () => {
  test.use({ locale: 'en-US' })

  test('is detected from the browser and can be changed in the settings', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Start meeting' })).toBeVisible()
    await expect(page.getByTestId('price-per-minute')).toHaveText('€5.00')
    await expect(page.getByText('per minute')).toBeVisible()
    await expect(page.getByText('€300 per hour')).toBeVisible()
    await expect(page.getByText('6 people')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.getByRole('button', { name: /Settings/ }).click()
    await page.getByRole('radio', { name: 'Deutsch' }).click()
    await expect(page.getByRole('heading', { name: 'Allgemein' })).toBeVisible()

    // The choice survives a reload, overriding the browser language
    await page.reload()
    await expect(page.getByRole('button', { name: /Einstellungen/ })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  })
})

test('keeps the screen on only while the meeting runs', async ({ page }) => {
  // Count the wake locks that are currently held
  await page.addInitScript(() => {
    const locks = { held: 0 }
    Object.assign(window, { locks })
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async () => {
          locks.held++
          const sentinel = {
            released: false,
            release: async () => {
              if (!sentinel.released) locks.held--
              sentinel.released = true
            },
          }
          return sentinel
        },
      },
    })
  })
  // Strict mode runs effects twice in dev, so count held locks rather than calls
  const held = () => page.evaluate(() => (window as unknown as { locks: { held: number } }).locks.held)

  await page.goto('/')
  await page.getByRole('button', { name: 'Meeting starten' }).click()
  await expect.poll(held).toBe(1)

  await page.getByRole('button', { name: /Pause/ }).click()
  await expect.poll(held).toBe(0)

  await page.getByRole('button', { name: /Weiter/ }).click()
  await expect.poll(held).toBe(1)

  await page.getByRole('button', { name: /Beenden/ }).click()
  await expect.poll(held).toBe(0)
})
