import { expect, test, type Page } from '@playwright/test'

// Regenerates the README screenshots in docs/screenshots. Not part of the test
// suite: run it explicitly with `npm run screenshots`.
test.skip(!process.env.SCREENSHOTS, 'only runs via npm run screenshots')

test.use({
  viewport: { width: 390, height: 780 },
  deviceScaleFactor: 2,
  locale: 'en-US',
  colorScheme: 'dark',
})

const OUT = 'docs/screenshots'

async function setUp(page: Page, settings: object = {}) {
  await page.clock.install({ time: new Date('2026-01-01T09:00:00') })
  // See meeting.spec.ts: let the fake clock drive all Motion animations.
  await page.addInitScript(() => {
    delete (Element.prototype as Partial<Element>).animate
  })
  // Seeded Math.random, so the falling bills land in the same places every time
  await page.addInitScript(() => {
    let seed = 42
    Math.random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }
  })
  await page.addInitScript((stored) => {
    localStorage.setItem('burn-rate-meter:settings', JSON.stringify({ version: 3, settings: stored }))
  }, settings)
  await page.goto('/')
  await page.clock.pauseAt(new Date('2026-01-01T09:00:01'))
}

async function startMeeting(page: Page, preset: string) {
  await page.getByRole('button', { name: new RegExp(preset) }).click()
  await page.getByRole('button', { name: 'Start meeting' }).click()
  await page.clock.runFor(1000)
}

test('quick start', async ({ page }) => {
  await setUp(page)
  await page.getByRole('button', { name: /ART-Meeting/ }).click()
  await page.clock.runFor(500)
  await page.screenshot({ path: `${OUT}/quick-start.png`, animations: 'disabled' })
})

test('meter', async ({ page }) => {
  // Small bills so several are falling at once
  await setUp(page, { billValue: 2 })
  await startMeeting(page, 'Bereichscall')
  await page.clock.fastForward('03:00')
  // Mid-fall: the burst from fast-forwarding plus the regular ones
  await page.clock.runFor(2300)
  await expect(page.getByTestId('bill').first()).toBeVisible()
  await page.screenshot({ path: `${OUT}/meter.png`, animations: 'disabled' })
})

test('result', async ({ page }) => {
  await setUp(page)
  await startMeeting(page, 'Teammeeting')
  await page.clock.fastForward('20:00')
  await page.getByRole('button', { name: /End/ }).click()
  // Let the last bills finish falling
  await page.clock.runFor(6000)
  await page.screenshot({ path: `${OUT}/result.png`, animations: 'disabled' })
})
