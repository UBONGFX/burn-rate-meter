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

// Link preview for chats and social media (og:image), in the app's dark look
test('og-image.png', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 630 })
  await page.setContent(`<body style="margin:0;font-family:system-ui,sans-serif">
    <div style="width:1200px;height:630px;box-sizing:border-box;padding:72px 84px;display:flex;align-items:center;
      gap:64px;color:#f6ece6;background:radial-gradient(ellipse at 50% 125%, rgb(255 90 20 / 0.45), transparent 65%), #0e0b0a">
      <div style="flex:1">
        <div style="font-size:44px;font-weight:800;letter-spacing:-0.02em">🔥 Burn Rate Meter</div>
        <div style="margin-top:28px;font-size:52px;font-weight:800;line-height:1.1;letter-spacing:-0.02em">
          How much money is this meeting burning right now?</div>
        <div style="margin-top:28px;font-size:28px;color:#b09a90">Live meeting cost meter</div>
      </div>
      <div style="width:400px;padding:44px 32px;border:2px solid #3a2a24;border-radius:36px;background:#1a1412;text-align:center">
        <div style="font-size:22px;font-weight:600;letter-spacing:0.12em;color:#b09a90">BURNED</div>
        <div style="margin-top:8px;font-size:92px;font-weight:800;letter-spacing:-0.03em;line-height:1;
          background:linear-gradient(180deg,#ffd27a,#ff7a1a 45%,#ff3d2e);-webkit-background-clip:text;color:transparent">€135</div>
        <div style="margin-top:28px;font-size:44px">🍕🍕🍕🍕🍕🍕</div>
        <div style="margin-top:12px;font-size:32px;font-weight:800">That's 12 pizzas</div>
      </div>
    </div>
  </body>`)
  await page.screenshot({ path: 'public/og-image.png' })
})
