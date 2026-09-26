import { expect, test } from '@playwright/test'
import { PAGES_APP as APP } from './servers.ts'

// Runs against a production build under /burn-rate-meter/, like on GitHub Pages

test('is installable: manifest with name and icons', async ({ page, request }) => {
  await page.goto(APP)
  const manifestUrl = await page.locator('link[rel=manifest]').evaluate((link: HTMLLinkElement) => link.href)
  const manifest = await (await request.get(manifestUrl)).json()
  expect(manifest).toMatchObject({ name: 'Burn Rate Meter', display: 'standalone', start_url: '.' })

  for (const icon of manifest.icons as { src: string; type: string }[]) {
    const response = await request.get(new URL(icon.src, manifestUrl).href)
    expect(response.ok(), icon.src).toBe(true)
    expect(response.headers()['content-type']).toBe(icon.type)
  }
})

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto(APP)
  // Wait until the service worker controls the page and has cached everything
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Meeting starten' })).toBeVisible()
  await page.getByRole('button', { name: 'Meeting starten' }).click()
  await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible()
  await context.setOffline(false)
})
