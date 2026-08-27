// Client-side CSV export. Hand-rolled (no dependency) and reuses the download
// primitive in lib/download.js. Money is exported raw (no ₦/commas) so
// spreadsheets can sum it; callers pass raw numeric fields, not formatNaira.
import { downloadBlob } from '@/lib/download'

// UTF-8 byte-order mark, prepended so Excel detects UTF-8 and renders accented
// client names/addresses correctly. Built via char code to keep the source ASCII.
const BOM = String.fromCharCode(0xfeff)

// Quote a field only when it contains a comma, quote, CR, or LF; double any
// internal quotes (RFC 4180).
function escapeField(value) {
  if (value == null) return ''
  const s = String(value)
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

// Build an RFC-4180 CSV string from rows + a column spec [{ header, value }].
// `value` is either a key string or a (row) => cell function.
export function toCSV(rows, columns) {
  const head = columns.map((c) => escapeField(c.header)).join(',')
  const body = rows.map((row) =>
    columns
      .map((c) => escapeField(typeof c.value === 'function' ? c.value(row) : row[c.value]))
      .join(',')
  )
  return [head, ...body].join('\r\n')
}

// Build a CSV (with BOM) and trigger a browser download.
export function downloadCSV(rows, columns, filename) {
  const blob = new Blob([BOM + toCSV(rows, columns)], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}
