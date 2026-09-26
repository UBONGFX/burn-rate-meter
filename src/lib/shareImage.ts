import type { Messages } from '../i18n/de'
import { compareCost, formatDuration } from './cost'
import { comparisonLabel, type MeetingResult } from './share'

// Square, so it looks good in chats and on social media
const SIZE = 1080
const MAX_EMOJIS = 12
const EMOJIS_PER_ROW = 6

/** The design tokens of the current color scheme, read from the page. */
function readPalette() {
  const css = getComputedStyle(document.documentElement)
  const token = (name: string) => css.getPropertyValue(name).trim()
  return {
    bg: token('--bg'),
    surface: token('--surface'),
    border: token('--border'),
    text: token('--text'),
    muted: token('--text-muted'),
    accent: token('--accent'),
    accent2: token('--accent-2'),
    counterTop: token('--counter-top'),
    glow: token('--glow'),
    glowStrength: Number(token('--glow-strength')) || 1,
  }
}

/** Largest font size (down from `max`) at which the text fits into `width`. */
function fitFontSize(ctx: CanvasRenderingContext2D, text: string, weight: number, max: number, width: number, family: string) {
  let size = max
  do {
    ctx.font = `${weight} ${size}px ${family}`
    if (ctx.measureText(text).width <= width) break
    size -= 4
  } while (size > 24)
  return size
}

/** Draws the result card as a 1080×1080 PNG, in the colors of the current theme. */
export function renderShareImage(t: Messages, formatEUR: (amount: number) => string, result: MeetingResult, siteLabel: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas not supported'))

  const p = readPalette()
  const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif'
  const center = SIZE / 2

  // Background with the warm glow from the bottom, like the app
  ctx.fillStyle = p.bg
  ctx.fillRect(0, 0, SIZE, SIZE)
  const glow = ctx.createRadialGradient(center, SIZE + 120, 0, center, SIZE + 120, 760)
  glow.addColorStop(0, `rgb(${p.glow} / ${0.4 * p.glowStrength})`)
  glow.addColorStop(1, `rgb(${p.glow} / 0)`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Card
  ctx.beginPath()
  ctx.roundRect(60, 60, SIZE - 120, SIZE - 120, 44)
  ctx.fillStyle = p.surface
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = p.border
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = p.text
  ctx.font = `800 40px ${family}`
  ctx.fillText('🔥 Burn Rate Meter', center, 160)

  ctx.fillStyle = p.muted
  ctx.font = `600 30px ${family}`
  ctx.letterSpacing = '4px'
  ctx.fillText(t.share.costHeadline(result.name).toUpperCase(), center, 262)
  ctx.letterSpacing = '0px'

  // The amount, with the counter's fiery gradient
  const amount = formatEUR(result.cost)
  const amountSize = fitFontSize(ctx, amount, 800, 190, 820, family)
  const amountGradient = ctx.createLinearGradient(0, 440 - amountSize * 0.75, 0, 440)
  amountGradient.addColorStop(0, p.counterTop)
  amountGradient.addColorStop(0.45, p.accent)
  amountGradient.addColorStop(1, p.accent2)
  ctx.fillStyle = amountGradient
  ctx.fillText(amount, center, 440)

  ctx.fillStyle = p.muted
  ctx.font = `500 36px ${family}`
  ctx.fillText(`⏱ ${formatDuration(result.elapsedMs)}  ·  👥 ${t.quickStart.people(result.people)}`, center, 520)

  // Dashed divider, like the bottom of a receipt
  ctx.setLineDash([10, 10])
  ctx.strokeStyle = p.border
  ctx.beginPath()
  ctx.moveTo(160, 585)
  ctx.lineTo(SIZE - 160, 585)
  ctx.stroke()
  ctx.setLineDash([])

  // What the money could have bought
  const comparison = comparisonLabel(t, result.cost)
  const emojiCount = comparison.count <= MAX_EMOJIS ? comparison.count : 1
  let y: number
  if (emojiCount === 1) {
    ctx.font = `130px ${family}`
    ctx.fillText(comparison.emoji, center, 735)
    y = 840
  } else {
    const rows = Math.ceil(emojiCount / EMOJIS_PER_ROW)
    ctx.font = `76px ${family}`
    for (let i = 0; i < emojiCount; i++) {
      const row = Math.floor(i / EMOJIS_PER_ROW)
      const inRow = Math.min(EMOJIS_PER_ROW, emojiCount - row * EMOJIS_PER_ROW)
      const x = center + (i % EMOJIS_PER_ROW - (inRow - 1) / 2) * 92
      ctx.fillText(comparison.emoji, x, 700 + row * 96)
    }
    y = 700 + (rows - 1) * 96 + 110
  }
  ctx.fillStyle = p.text
  const comparisonSize = fitFontSize(ctx, comparison.text, 800, 56, 820, family)
  ctx.font = `800 ${comparisonSize}px ${family}`
  ctx.fillText(comparison.text, center, y)
  if (!compareCost(result.cost)) {
    // "Nicht mal ein Kaffee" gets its "Gut gemacht!", like in the app
    ctx.fillStyle = p.muted
    ctx.font = `500 34px ${family}`
    ctx.fillText(t.meter.noComparisonSub, center, y + 56)
  }

  ctx.fillStyle = p.muted
  ctx.font = `500 28px ${family}`
  ctx.fillText(siteLabel, center, SIZE - 105)

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create image'))), 'image/png'),
  )
}
