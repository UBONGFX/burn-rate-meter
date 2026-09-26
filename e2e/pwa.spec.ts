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

test('has a link preview image for chats and social media', async ({ page, request }) => {
  await page.goto(APP)
  const meta = (property: string) => page.locator(`meta[property="${property}"]`).getAttribute('content')
  expect(await meta('og:image')).toBe('https://ubongfx.github.io/burn-rate-meter/og-image.png')
  expect([await meta('og:image:width'), await meta('og:image:height')]).toEqual(['1200', '630'])

  // The image the tag points to is part of the build (checked locally, not on the live site)
  const image = await request.get(`${APP}og-image.png`)
  expect(image.headers()['content-type']).toBe('image/png')
  const png = await image.body()
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
})

test.describe('launch', () => {
  test.use({ colorScheme: 'dark' })

  test('shows a themed splash until the app has loaded', async ({ page }) => {
    // Hold back the app's script to look at the page before it runs
    let release!: () => void
    const scriptHeld = new Promise<void>((resolve) => (release = resolve))
    await page.route('**/assets/*.js', async (route) => {
      await scriptHeld
      await route.continue()
    })

    await page.goto(APP, { waitUntil: 'commit' })
    await expect(page.getByText('🔥')).toBeVisible()
    // Dark background right away – no white flash
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgb(14, 11, 10)')

    release()
    await expect(page.getByRole('button', { name: 'Meeting starten' })).toBeVisible()
    await expect(page.locator('.splash')).toHaveCount(0)
  })

  test('starts from the cache when the network is slow', async ({ page, context, browserName }) => {
    // Playwright can only delay service worker requests in Chromium
    test.skip(browserName !== 'chromium', 'needs routing of service worker requests')
    await page.goto(APP)
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
      }
    })

    // A very slow network: the page takes 10 s
    await context.route(APP, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 10_000))
      await route.continue().catch(() => {})
    })
    const started = Date.now()
    await page.reload({ waitUntil: 'commit' })
    await expect(page.getByRole('button', { name: 'Meeting starten' })).toBeVisible()
    expect(Date.now() - started).toBeLessThan(6000)
  })
})
