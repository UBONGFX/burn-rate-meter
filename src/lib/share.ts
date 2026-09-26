import type { Messages } from '../i18n/de'
import { compareCost, formatDuration } from './cost'

/** Everything the share text and image show about a finished meeting. */
export type MeetingResult = {
  name: string | null
  cost: number
  elapsedMs: number
  people: number
}

type Format = (amount: number) => string

/** "Das sind 12 Pizzen" or "Nicht mal ein Kaffee", without emoji. */
export function comparisonLabel(t: Messages, cost: number): { emoji: string; count: number; text: string } {
  const comparison = compareCost(cost)
  if (!comparison) return { emoji: '☕', count: 1, text: t.meter.noComparison }
  const label = t.comparisons[comparison.key][comparison.count === 1 ? 0 : 1]
  return { emoji: comparison.emoji, count: comparison.count, text: `${t.meter.comparisonPrefix} ${comparison.count} ${label}` }
}

/** The text that goes into chats, e.g. Slack or WhatsApp. */
export function shareText(t: Messages, formatEUR: Format, result: MeetingResult, url: string): string {
  const comparison = comparisonLabel(t, result.cost)
  const verdict = compareCost(result.cost) ? `${comparison.emoji} ${comparison.text}!` : `☕ ${comparison.text}. ${t.meter.noComparisonSub}`
  return [
    t.share.costLine(result.name, formatEUR(result.cost)),
    `⏱ ${formatDuration(result.elapsedMs)} · 👥 ${t.quickStart.people(result.people)}`,
    verdict,
    '',
    t.share.footer(url),
  ].join('\n')
}
