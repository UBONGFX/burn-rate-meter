import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Scans every screen with axe (WCAG 2.1 A/AA) in both color schemes.

async function expectNoViolations(page: Page) {
  // Scan the settled screen: mid-fade elements would report false contrast issues.
  await page.waitForFunction(() => document.getAnimations().length === 0)
  await page.waitForTimeout(300)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const summary = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => `${n.target.join(' ')} – ${n.failureSummary?.split('\n').slice(1).join(' ')}`),
  }))
  expect(summary).toEqual([])
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme, reducedMotion: 'reduce' })

    test('quick start, with and without the attendee list', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('button', { name: 'Meeting starten' })).toBeVisible()
      await expectNoViolations(page)
      await page.getByRole('button', { name: /anpassen/i }).click()
      await expect(page.getByLabel('Architect · 60 €/h', { exact: true })).toBeVisible()
      await expectNoViolations(page)
    })

    test('meter and result', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /Teammeeting/ }).click()
      await page.getByRole('button', { name: 'Meeting starten' }).click()
      await page.getByRole('button', { name: /anpassen/i }).click()
      await expect(page.getByLabel('Architect · 60 €/h', { exact: true })).toBeVisible()
      await expectNoViolations(page)
      await page.getByRole('button', { name: /Beenden/ }).click()
      await expect(page.getByRole('button', { name: 'Nochmal gleich' })).toBeVisible()
      await expectNoViolations(page)
    })

    test('settings and reset dialog', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /Einstellungen/ }).click()
      await page.getByRole('button', { name: /^Teammeeting/ }).click()
      await expect(page.getByLabel('Name der Vorlage')).toBeVisible()
      await expectNoViolations(page)
      await page.getByRole('button', { name: 'Auf Standard zurücksetzen' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expectNoViolations(page)
    })
  })
}

test('a whole meeting works with the keyboard only', async ({ page }) => {
  await page.goto('/')
  const tabTo = async (name: string | RegExp) => {
    const target = page.getByRole('button', { name })
    for (let i = 0; i < 40 && !(await target.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab')
    }
    await expect(target).toBeFocused()
  }

  await tabTo(/Teammeeting/)
  await page.keyboard.press('Enter')
  await tabTo('Meeting starten')
  await page.keyboard.press('Enter')

  await tabTo(/Pause/)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: /Weiter/ })).toBeVisible()
  await tabTo(/Beenden/)
  await page.keyboard.press('Enter')

  await tabTo('Nochmal gleich')
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible()
})
