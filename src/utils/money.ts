/** ₹ with Indian digit grouping, e.g. formatRupees(1234567.5, 2) → "₹12,34,567.50". */
export function formatRupees(n: number, decimals = 0): string {
  const value = Number.isFinite(n) ? n : 0;
  const [whole, frac] = Math.abs(value).toFixed(decimals).split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const sign = value < 0 && Number(whole + (frac ?? '')) !== 0 ? '-' : '';
  return `${sign}₹${rest ? `${rest},` : ''}${last3}${frac ? `.${frac}` : ''}`;
}

/** Trims trailing zeros: 8.597 → "8.597", 75 → "75", 0.1 → "0.1". */
export const formatQty = (n: number, maxDecimals = 3) =>
  Number.isFinite(n) ? String(Number(n.toFixed(maxDecimals))) : '0';
