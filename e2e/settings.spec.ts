import { devices, expect, test, type Page } from '@playwright/test'

async function openSettings(page: Page) {
  await page.getByRole('button', { name: /Einstellungen/ }).click()
  await expect(page.getByRole('heading', { name: 'Standardwerte' })).toBeVisible()
}

async function backToStart(page: Page) {
  await page.getByRole('button', { name: /Zurück/ }).click()
  await expect(page.getByRole('heading', { name: 'Schnellstart' })).toBeVisible()
}

const defaultsSection = (page: Page) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: 'Standardwerte' }) })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('default values are used in the quick start and survive a reload', async ({ page }) => {
  await openSettings(page)
  const defaults = defaultsSection(page)
  await defaults.getByLabel('Meetinggröße', { exact: true }).fill('10')
  await defaults.getByLabel('Stundensatz', { exact: true }).fill('60')
  await backToStart(page)

  // 10 people × 60 €/h = 10 €/min
  await expect(page.getByLabel('Personen', { exact: true })).toHaveValue('10')
  await expect(page.getByLabel('Stundensatz', { exact: true })).toHaveValue('60')
  await expect(page.getByText('10,00 € pro Minute')).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Personen', { exact: true })).toHaveValue('10')
})

test('the +/− buttons respect the limits', async ({ page }) => {
  await openSettings(page)
  const people = defaultsSection(page).getByLabel('Meetinggröße', { exact: true })
  await people.fill('2')
  const decrease = defaultsSection(page).getByRole('button', { name: 'Meetinggröße verringern' })
  await decrease.click()
  await expect(people).toHaveValue('1')
  await expect(decrease).toBeDisabled()

  // Out-of-range input is not saved
  await people.fill('9999')
  await people.blur()
  await expect(people).toHaveValue('1')
})

test('a preset can be added, edited and used', async ({ page }) => {
  await openSettings(page)
  await page.getByRole('button', { name: '+ Vorlage hinzufügen' }).click()

  const row = page.getByRole('listitem').last()
  await row.getByLabel('Name der Vorlage').fill('Daily')
  await row.getByLabel('Personen', { exact: true }).fill('5')
  await row.getByLabel('Stundensatz', { exact: true }).fill('90')
  await backToStart(page)

  // 5 × 90 €/h = 7,50 €/min
  await page.getByRole('button', { name: /Daily/ }).click()
  await expect(page.getByText('7,50 € pro Minute')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: /Daily/ })).toBeVisible()
})

test('a preset can be deleted', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Bereichscall/ })).toBeVisible()
  await openSettings(page)
  await page.getByRole('button', { name: 'Bereichscall löschen' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await backToStart(page)

  await expect(page.getByRole('button', { name: /Bereichscall/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Teammeeting/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: /Bereichscall/ })).toHaveCount(0)
})

test('reset restores all defaults after confirming', async ({ page }) => {
  await openSettings(page)
  await page.getByRole('button', { name: 'Bereichscall löschen' }).click()
  await defaultsSection(page).getByLabel('Meetinggröße', { exact: true }).fill('20')

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Auf Standard zurücksetzen' }).click()

  await expect(defaultsSection(page).getByLabel('Meetinggröße', { exact: true })).toHaveValue('6')
  await expect(page.getByRole('listitem')).toHaveCount(3)
})

test('reset does nothing when cancelled', async ({ page }) => {
  await openSettings(page)
  await defaultsSection(page).getByLabel('Meetinggröße', { exact: true }).fill('20')

  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'Auf Standard zurücksetzen' }).click()
  await expect(defaultsSection(page).getByLabel('Meetinggröße', { exact: true })).toHaveValue('20')
})

test('the bill value sets how often bills fall', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T09:00:00') })
  // See meeting.spec.ts: let the fake clock drive all Motion animations.
  await page.addInitScript(() => {
    delete (Element.prototype as Partial<Element>).animate
  })
  await page.goto('/')
  await page.clock.pauseAt(new Date('2026-01-01T09:00:01'))

  // The clock is paused, so every view switch needs runFor() to animate.
  await page.getByRole('button', { name: /Einstellungen/ }).click()
  await page.clock.runFor(1000)
  await defaultsSection(page).getByLabel('Ein Geldschein pro', { exact: true }).fill('1')
  await page.getByRole('button', { name: /Zurück/ }).click()
  await page.clock.runFor(1000)

  // Teammeeting: 10 €/min → one 1 € bill every 6 s
  await page.getByRole('button', { name: /Teammeeting/ }).click()
  await page.getByRole('button', { name: 'Meeting starten' }).click()
  await page.clock.runFor(1000)
  await expect(page.locator('.bill')).toHaveCount(0)

  await page.clock.runFor(6000)
  await expect(page.locator('.bill')).toHaveCount(1)
  await expect(page.locator('.bill').first()).toContainText('1 €')

  // Bills remove themselves after falling (at most ~5 s)
  await page.clock.runFor(6000)
  await expect(page.locator('.bill')).toHaveCount(1)
})

test.describe('on a phone', () => {
  // Only the phone's screen settings: the device's default browser (WebKit) can't be switched per group.
  const { viewport, deviceScaleFactor, isMobile, hasTouch } = devices['iPhone 13']
  test.use({ viewport, deviceScaleFactor, isMobile, hasTouch })

  test('no page scrolls sideways and no number field is cut off', async ({ page }) => {
    const layoutProblems = () =>
      page.evaluate(() => ({
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
        truncatedInputs: [...document.querySelectorAll<HTMLInputElement>('.stepper-input input')].filter(
          (input) => input.scrollWidth > input.clientWidth,
        ).length,
      }))

    expect(await layoutProblems()).toEqual({ overflowX: 0, truncatedInputs: 0 })
    await openSettings(page)
    expect(await layoutProblems()).toEqual({ overflowX: 0, truncatedInputs: 0 })
  })
})
