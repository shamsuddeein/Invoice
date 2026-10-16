// Client-side Excel (.xlsx) export using SheetJS (xlsx).
// Reuses the download primitive in lib/download.js.
import * as XLSX from 'xlsx'
import { downloadBlob } from '@/lib/download'

/**
 * Build an Excel (.xlsx) workbook from rows + columns and trigger browser download.
 * @param {Array<Object>} rows - Array of objects to export
 * @param {Array<{header: string, value: string|Function}>} columns - Column definitions
 * @param {string} filename - Filename ending in .xlsx
 * @param {string} [sheetName='Sheet1'] - Optional worksheet name
 */
export function downloadExcel(rows, columns, filename, sheetName = 'Sheet1') {
  const headers = columns.map((c) => c.header)
  const data = [
    headers,
    ...rows.map((row) =>
      columns.map((c) => {
        const val = typeof c.value === 'function' ? c.value(row) : row[c.value]
        return val == null ? '' : val
      })
    ),
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)

  // Auto-calculate column widths with minimum and maximum bounds
  ws['!cols'] = columns.map((col, idx) => {
    let maxLen = col.header.length
    for (let i = 1; i < data.length; i++) {
      const cellVal = data[i][idx]
      const len = cellVal != null ? String(cellVal).length : 0
      if (len > maxLen) maxLen = len
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))

  const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([u8], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  downloadBlob(blob, safeFilename)
}
