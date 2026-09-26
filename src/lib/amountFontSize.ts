/**
 * Font size for a big money amount (meter counter, quick start price):
 * as large as possible, but shrinking with the number of characters so long
 * amounts like "12.345,67 €" still fit the page width (max 760px minus gutters).
 */
export function amountFontSize(text: string): string {
  return `min(8.5rem, calc(${(1.55 / text.length).toFixed(4)} * min(100vw - 32px, 728px)))`
}
