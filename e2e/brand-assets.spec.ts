import { test } from '@playwright/test'

// Regenerates the app icons in public/icons. Not part of the test suite:
// run it explicitly with `npm run brand-assets`.
test.skip(!process.env.BRAND_ASSETS, 'only runs via npm run brand-assets')
test.use({ deviceScaleFactor: 1 })

const OUT = 'public/icons'

// Dark background with the app's warm glow and the flame. The flame stays inside
// the central 80% "safe zone", so the same image works as a maskable icon.
function iconHtml(size: number) {
  return `<body style="margin:0">
    <div style="width:${size}px;height:${size}px;display:grid;place-items:center;
      background:radial-gradient(circle at 50% 95%, rgb(255 90 20 / 0.55), transparent 70%), #0e0b0a">
      <span style="font-size:${Math.round(size * 0.52)}px;line-height:1;
        filter:drop-shadow(0 0 ${Math.round(size * 0.05)}px rgb(255 122 26 / 0.8))">🔥</span>
    </div>
  </body>`
}

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
] as const) {
  test(name, async ({ page }) => {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(iconHtml(size))
    await page.screenshot({ path: `${OUT}/${name}` })
  })
}
