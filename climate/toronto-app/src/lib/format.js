export const pct = (v, d = 0) => (v == null ? '—' : (v * 100).toFixed(d) + '%')
export const num = (v) => (v == null ? '—' : Math.round(v).toLocaleString())
export const signed = (v, d = 1) => (v == null ? '—' : (v > 0 ? '+' : '') + v.toFixed(d))

// median of a numeric array (ignoring null/NaN)
export function median(arr) {
  const a = arr.filter((v) => v != null && isFinite(v)).sort((x, y) => x - y)
  if (!a.length) return null
  const mid = Math.floor(a.length / 2)
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2
}

// ordinal rank (1 = highest) of a value within an array
export function rankOf(value, arr, descending = true) {
  const a = arr.filter((v) => v != null && isFinite(v))
  const sorted = [...a].sort((x, y) => (descending ? y - x : x - y))
  return sorted.indexOf(value) + 1
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
