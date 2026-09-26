import { expect, test, type Page } from '@playwright/test'

type Captured = { copied?: string; shared?: { text: string; files: { name: string; type: string; size: number }[] } }

/** Replaces the share sheet and clipboard with fakes that record what they got. */
async function fakeSharing(page: Page, { canShareFiles, cancel = false }: { canShareFiles: boolean; cancel?: boolean }) {
  await page.addInitScript(
    ({ canShareFiles, cancel }) => {
      const captured: Record<string, unknown> = {}
      Object.assign(window, { captured })
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (text: string) => void (captured.copied = text) },
      })
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShareFiles ? () => true : undefined })
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: canShareFiles
          ? async (data: ShareData) => {
              if (cancel) throw new DOMException('Share canceled', 'AbortError')
              captured.shared = {
                text: data.text,
                files: (data.files ?? []).map((f) => ({ name: f.name, type: f.type, size: f.size })),
              }
            }
          : undefined,
      })
    },
    { canShareFiles, cancel },
  )
}

const captured = (page: Page) => page.evaluate(() => (window as unknown as { captured: Captured }).captured)

/** A 20-minute Teammeeting (8 people, 6,75 €/min) under the fake clock. */
async function finishMeeting(page: Page) {
  await page.clock.install({ time: new Date('2026-01-01T09:00:00') })
  await page.addInitScript(() => {
    delete (Element.prototype as Partial<Element>).animate
  })
  await page.goto('/')
  await page.clock.pauseAt(new Date('2026-01-01T09:01:00'))
  await page.getByRole('button', { name: /Teammeeting/ }).click()
  await page.getByRole('button', { name: 'Meeting starten' }).click()
  await page.clock.runFor(1000)
  await page.clock.fastForward('20:00')
  await page.getByRole('button', { name: /Beenden/ }).click()
  await page.clock.runFor(2000)
}

const shareButton = (page: Page) => page.getByRole('button', { name: /Ergebnis teilen/ })

test('shares image and text through the share sheet', async ({ page }) => {
  await fakeSharing(page, { canShareFiles: true })
  await finishMeeting(page)
  await shareButton(page).click()

  await expect.poll(async () => (await captured(page)).shared).toBeTruthy()
  const { shared, copied } = await captured(page)
  expect(shared!.files).toEqual([{ name: 'burn-rate-meter.png', type: 'image/png', size: expect.any(Number) }])
  expect(shared!.files[0].size).toBeGreaterThan(10_000)
  expect(shared!.text).toContain('🔥 Teammeeting hat 135,')
  expect(shared!.text).toContain('🍕 Das sind 12 Pizzen!')
  expect(shared!.text).toContain('Gemessen mit Burn Rate Meter: http')
  expect(copied).toBeUndefined()
})

test('closing the share sheet is not an error', async ({ page }) => {
  await fakeSharing(page, { canShareFiles: true, cancel: true })
  await finishMeeting(page)
  let downloaded = false
  page.on('download', () => (downloaded = true))
  await shareButton(page).click()

  await expect(shareButton(page)).toBeEnabled()
  // No error message, no fallback download
  await expect(page.getByRole('status')).toBeHidden()
  expect(downloaded).toBe(false)
})

test('without a share sheet, downloads the image and copies the text', async ({ page }) => {
  await fakeSharing(page, { canShareFiles: false })
  await finishMeeting(page)

  const downloadPromise = page.waitForEvent('download')
  await shareButton(page).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('burn-rate-meter.png')

  // A real 1080×1080 PNG (width and height sit in the IHDR chunk)
  const png = await (await download.createReadStream()).toArray().then((chunks) => Buffer.concat(chunks))
  expect(png.subarray(1, 4).toString()).toBe('PNG')
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1080, 1080])

  await expect(page.getByRole('status')).toHaveText('Bild gespeichert und Text kopiert – einfach einfügen.')
  expect((await captured(page)).copied).toContain('⏱ 20:0')
})
