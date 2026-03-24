/**
 * Format a price value as "$X,XXX TTD" with no decimals and comma separators.
 * Usage: formatPrice(1199.99) → "$1,200 TTD"
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '';
  return `$${Math.round(price).toLocaleString('en-US')} TTD`;
}

/**
 * Format a plain number with commas, no decimals, no currency symbols.
 * Usage: formatNumber(98267594) → "98,267,594"
 */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}
