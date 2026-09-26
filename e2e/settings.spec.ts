import { devices, expect, test, type Page } from '@playwright/test'

async function openSettings(page: Page) {
  await page.getByRole('button', { name: /Einstellungen/ }).click()
  await expect(page.getByRole('heading', { name: 'Standard-Besetzung' })).toBeVisible()
}

async function backToStart(page: Page) {
  await page.getByRole('button', { name: /Zurück/ }).click()
  await expect(page.getByRole('heading', { name: 'Schnellstart' })).toBeVisible()
}

const section = (page: Page, heading: string) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: heading, exact: true }) })
const defaultsSection = (page: Page) => section(page, 'Standard-Besetzung')
const rolesSection = (page: Page) => section(page, 'Rollen')
const presetsSection = (page: Page) => section(page, 'Vorlagen')
// List rows without the trailing "+ … hinzufügen" row
const roleRows = (page: Page) => rolesSection(page).locator('li').filter({ has: page.getByLabel('Name der Rolle') })
const presetRows = (page: Page) => presetsSection(page).locator('li').filter({ has: page.locator('.preset-row') })
const editPreset = (page: Page, name: string) =>
  presetsSection(page).getByRole('button', { name: new RegExp(`^${name}`) }).click()
const openAttendees = (page: Page) => page.getByRole('button', { name: /anpassen/i }).click()
const startButton = (page: Page) => page.getByRole('button', { name: 'Meeting starten' })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the default attendance is used in the quick start and survives a reload', async ({ page }) => {
  await openSettings(page)
  await defaultsSection(page).getByLabel('Developer · 50 €/h', { exact: true }).fill('10')
  await defaultsSection(page).getByLabel('Product Owner · 55 €/h', { exact: true }).fill('1')
  await backToStart(page)

  // 10 × 50 + 1 × 55 = 555 €/h = 9,25 €/min
  await expect(page.locator('.attendee-chip')).toHaveText(['10 Developer', '1 Product Owner'])
  await openAttendees(page)
  await expect(page.getByLabel('Developer · 50 €/h', { exact: true })).toHaveValue('10')
  await expect(page.getByLabel('Product Owner · 55 €/h', { exact: true })).toHaveValue('1')
  await expect(page.locator('.qs-price')).toHaveText('9,25 €')
  await expect(page.getByText('555 € pro Stunde')).toBeVisible()
  await expect(page.getByText('11 Personen')).toBeVisible()

  await page.reload()
  await expect(page.locator('.attendee-chip')).toHaveText(['10 Developer', '1 Product Owner'])
})

test('counts stop at zero and a meeting needs at least one person', async ({ page }) => {
  await openAttendees(page)
  const team = page.getByLabel('Developer · 50 €/h', { exact: true })
  await team.fill('1')
  const decrease = page.getByRole('button', { name: 'Developer · 50 €/h verringern' })
  await decrease.click()
  await expect(team).toHaveValue('0')
  await expect(decrease).toBeDisabled()
  await expect(startButton(page)).toBeDisabled()
  await expect(page.getByText('Noch niemand ausgewählt')).toBeVisible()

  // Out-of-range input is ignored
  await team.fill('9999')
  await team.blur()
  await expect(team).toHaveValue('0')
})

test('a role can be added with its own rate and used in the quick start', async ({ page }) => {
  await openSettings(page)
  await rolesSection(page).getByRole('button', { name: '+ Rolle hinzufügen' }).click()
  const row = roleRows(page).last()
  await row.getByLabel('Name der Rolle').fill('UX Designer')
  await row.getByLabel('Stundensatz', { exact: true }).fill('60')
  await backToStart(page)

  // Default 6 × Developer (300 €/h) + 1 × UX Designer (60 €/h) = 360 €/h = 6 €/min
  await openAttendees(page)
  await page.getByLabel('UX Designer · 60 €/h', { exact: true }).fill('1')
  await expect(page.locator('.qs-price')).toHaveText('6,00 €')
  await expect(page.getByText('360 € pro Stunde')).toBeVisible()
  await expect(page.getByText('7 Personen')).toBeVisible()

  await page.reload()
  await openAttendees(page)
  await expect(page.getByLabel('UX Designer · 60 €/h', { exact: true })).toBeVisible()
})

test('changing a role rate changes every preset using it', async ({ page }) => {
  await openSettings(page)
  await roleRows(page).first().getByLabel('Stundensatz', { exact: true }).fill('140')
  await backToStart(page)

  // Teammeeting: 6 × 140 (Developer) + 55 + 50 = 945 €/h = 15,75 €/min
  await page.getByRole('button', { name: /Teammeeting/ }).click()
  await expect(page.locator('.qs-price')).toHaveText('15,75 €')
})

test('deleting a role removes it from the quick start and presets', async ({ page }) => {
  await openSettings(page)
  await page.getByRole('button', { name: 'Rolle Management löschen' }).click()
  await expect(roleRows(page)).toHaveCount(5)
  await editPreset(page, 'ART-Meeting')
  await expect(presetsSection(page).getByLabel('Developer · 50 €/h', { exact: true })).toBeVisible()
  await expect(presetsSection(page).getByLabel(/^Management/)).toHaveCount(0)
  await backToStart(page)

  await openAttendees(page)
  await expect(page.getByLabel('Developer · 50 €/h', { exact: true })).toBeVisible()
  await expect(page.getByLabel(/^Management/)).toHaveCount(0)
  // ART-Meeting was 46 people, 1 of them Management
  await page.getByRole('button', { name: /ART-Meeting/ }).click()
  await expect(page.getByText('45 Personen')).toBeVisible()
})

test('the last role cannot be deleted', async ({ page }) => {
  await openSettings(page)
  for (const role of ['Management', 'Team Lead', 'Architect', 'Scrum Master', 'Product Owner']) {
    await page.getByRole('button', { name: `Rolle ${role} löschen` }).click()
  }
  await expect(page.getByRole('button', { name: 'Rolle Developer löschen' })).toBeDisabled()
})

test('a preset can be added, edited and used', async ({ page }) => {
  await openSettings(page)
  await page.getByRole('button', { name: '+ Vorlage hinzufügen' }).click()

  // A new preset opens right away for editing
  const row = presetRows(page).last()
  await row.getByLabel('Name der Vorlage').fill('Daily')
  await row.getByLabel('Developer · 50 €/h', { exact: true }).fill('5')
  await row.getByLabel('Scrum Master · 50 €/h', { exact: true }).fill('1')
  await backToStart(page)

  // 5 × 50 + 1 × 50 = 300 €/h = 5 €/min
  await page.getByRole('button', { name: /Daily/ }).click()
  await expect(page.locator('.qs-price')).toHaveText('5,00 €')
  await expect(page.getByText('300 € pro Stunde')).toBeVisible()
  await expect(page.getByText('6 Personen')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: /Daily/ })).toBeVisible()
})

test('a preset can be deleted', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Bereichscall/ })).toBeVisible()
  await openSettings(page)
  await editPreset(page, 'Bereichscall')
  await page.getByRole('button', { name: 'Bereichscall löschen' }).click()
  await expect(presetRows(page)).toHaveCount(2)
  await backToStart(page)

  await expect(page.getByRole('button', { name: /Bereichscall/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Teammeeting/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: /Bereichscall/ })).toHaveCount(0)
})

test('reset restores all defaults after confirming', async ({ page }) => {
  await openSettings(page)
  await editPreset(page, 'Bereichscall')
  await page.getByRole('button', { name: 'Bereichscall löschen' }).click()
  await page.getByRole('button', { name: 'Rolle Management löschen' }).click()
  await defaultsSection(page).getByLabel('Developer · 50 €/h', { exact: true }).fill('20')

  await page.getByRole('button', { name: 'Auf Standard zurücksetzen' }).click()
  const dialog = page.getByRole('dialog', { name: 'Alles zurücksetzen?' })
  await dialog.getByRole('button', { name: 'Zurücksetzen' }).click()
  await expect(dialog).toBeHidden()

  await expect(defaultsSection(page).getByLabel('Developer · 50 €/h', { exact: true })).toHaveValue('6')
  await expect(roleRows(page)).toHaveCount(6)
  await expect(presetRows(page)).toHaveCount(3)
})

test('reset does nothing when cancelled', async ({ page }) => {
  await openSettings(page)
  await defaultsSection(page).getByLabel('Developer · 50 €/h', { exact: true }).fill('20')

  const dialog = page.getByRole('dialog', { name: 'Alles zurücksetzen?' })
  // Cancel button, Escape and a click on the backdrop all keep the settings
  await page.getByRole('button', { name: 'Auf Standard zurücksetzen' }).click()
  await expect(dialog.getByRole('button', { name: 'Abbrechen' })).toBeFocused()
  await dialog.getByRole('button', { name: 'Abbrechen' }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: 'Auf Standard zurücksetzen' }).click()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: 'Auf Standard zurücksetzen' }).click()
  await page.mouse.click(5, 5)
  await expect(dialog).toBeHidden()

  await expect(defaultsSection(page).getByLabel('Developer · 50 €/h', { exact: true })).toHaveValue('20')
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
  await page.getByLabel('Ein Geldschein pro', { exact: true }).fill('1')
  await page.getByRole('button', { name: /Zurück/ }).click()
  await page.clock.runFor(1000)

  // Teammeeting: 6,75 €/min → one 1 € bill about every 8,9 s
  await page.getByRole('button', { name: /Teammeeting/ }).click()
  await startButton(page).click()
  await page.clock.runFor(1000)
  await expect(page.locator('.bill')).toHaveCount(0)

  await page.clock.runFor(9000)
  await expect(page.locator('.bill')).toHaveCount(1)
  await expect(page.locator('.bill').first()).toContainText('1 €')

  // The bill removes itself after falling (at most 5 s), before the next one is due
  await page.clock.runFor(6000)
  await expect(page.locator('.bill')).toHaveCount(0)
})

test.describe('on a phone', () => {
  // Only the phone's screen settings: the device's default browser (WebKit) can't be switched per group.
  const { viewport, deviceScaleFactor, isMobile, hasTouch } = devices['iPhone 13']
  test.use({ viewport, deviceScaleFactor, isMobile, hasTouch })

  test('no page scrolls sideways and no number field is cut off', async ({ page }) => {
    const layoutProblems = () =>
      page.evaluate(() => ({
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
        // Header items wrapping onto a second line make them taller than one button row
        headerWraps: [...document.querySelectorAll<HTMLElement>('.app-header > *')].some((el) => el.offsetHeight > 48),
        truncatedInputs: [...document.querySelectorAll<HTMLInputElement>('.stepper-input input')].filter(
          (input) => input.scrollWidth > input.clientWidth,
        ).length,
      }))

    expect(await layoutProblems()).toEqual({ overflowX: 0, headerWraps: false, truncatedInputs: 0 })
    await openSettings(page)
    expect(await layoutProblems()).toEqual({ overflowX: 0, headerWraps: false, truncatedInputs: 0 })
  })
})
