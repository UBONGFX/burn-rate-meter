import { expect, test, type Page } from '@playwright/test'

/** Reads the big counter as a number, e.g. "1,23 €" → 1.23 (German locale). */
async function readCounter(page: Page): Promise<number> {
  const text = await page.locator('.counter').innerText()
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

  // Teammeeting preset: 8 people × 75 €/h = 10 €/min
  await page.getByRole('button', { name: /Teammeeting/ }).click()
  await expect(page.getByText('10,00 € pro Minute')).toBeVisible()
  await page.getByRole('button', { name: 'Meeting starten' }).click()
  await page.clock.runFor(1000) // page transition
  await expect(page.locator('.counter')).toBeVisible()

  // 6 seconds at 10 €/min = 1 €
  const start = await readCounter(page)
  await page.clock.runFor(6000)
  await page.getByRole('button', { name: /Pause/ }).click()
  // Let the pause settle: the timer replaces the last frame's value with the exact time.
  await page.clock.runFor(100)
  const afterRunning = await readCounter(page)
  expect(afterRunning - start).toBeCloseTo(1, 1)

  // Paused time costs nothing
  await page.clock.runFor(30_000)
  expect(await readCounter(page)).toBe(afterRunning)

  // Double the headcount: only the future gets more expensive (2 € per 6 s)
  await page.getByRole('button', { name: /Weiter/ }).click()
  await page.getByLabel('Personen im Raum', { exact: true }).fill('16')
  await page.clock.runFor(6000)
  await page.getByRole('button', { name: /Beenden/ }).click()
  await page.clock.runFor(100)
  const total = await readCounter(page)
  expect(total - afterRunning).toBeCloseTo(2, 1)

  // Summary (under 3,50 € there is no comparison yet)
  await page.clock.runFor(1000)
  await expect(page.getByText('16 Personen')).toBeVisible()
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
    await expect(page.getByText('€8.00 per minute')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.getByRole('button', { name: /Settings/ }).click()
    await page.getByRole('radio', { name: 'Deutsch' }).click()
    await expect(page.getByRole('heading', { name: 'Sprache' })).toBeVisible()

    // The choice survives a reload, overriding the browser language
    await page.reload()
    await expect(page.getByRole('button', { name: /Einstellungen/ })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  })
})
