'use client'

import { useState, createElement } from 'react'
import Button from '@/components/ui/Button'
import { DownloadIcon, ImageIcon, PrinterIcon } from '@/components/ui/icons'
import { downloadNodePNG, printNode } from '@/lib/download'
import { useToast } from '@/components/ui/Toast'

// Print + Save Image + Download PDF for a document. The react-pdf renderer and the
// PDF document component are dynamic-imported inside the handler so @react-pdf/
// renderer never enters the server bundle. "Save Image" rasterizes the on-screen
// preview node (targetId) via html2canvas; "Print" clones that same node into a
// hidden iframe and prints it (faithful — the preview is inline-styled).
export default function DocumentActions({
  kind, // 'invoice' | 'receipt'
  targetId,
  fileBase,
  business,
  invoice,
  payment,
  size,
}) {
  const [busy, setBusy] = useState('') // '' | 'print' | 'png' | 'pdf'
  const [error, setError] = useState('')
  const toast = useToast()

  async function handlePrint() {
    setBusy('print')
    setError('')
    try {
      await printNode(document.getElementById(targetId), fileBase)
    } catch (e) {
      setError(e.message || 'Could not open the print view.')
    } finally {
      setBusy('')
    }
  }

  async function downloadPNG() {
    setBusy('png')
    setError('')
    try {
      await downloadNodePNG(document.getElementById(targetId), `${fileBase}.png`)
      toast.success(`Saved ${fileBase}.png`)
    } catch (e) {
      setError(e.message || 'Could not generate image.')
    } finally {
      setBusy('')
    }
  }

  async function downloadPDF() {
    setBusy('pdf')
    setError('')
    try {
      const { pdf } = await import('@react-pdf/renderer')
      let element
      if (kind === 'receipt') {
        const { default: ReceiptPreviewPDF } = await import('@/components/invoice-doc/ReceiptPreviewPDF')
        element = createElement(ReceiptPreviewPDF, { business, invoice, payment })
      } else {
        const { default: InvoicePreviewPDF } = await import('@/components/invoice-doc/InvoicePreviewPDF')
        element = createElement(InvoicePreviewPDF, { business, invoice })
      }
      const blob = await pdf(element).toBlob()
      const { downloadBlob } = await import('@/lib/download')
      downloadBlob(blob, `${fileBase}.pdf`)
      toast.success(`Downloaded ${fileBase}.pdf`)
    } catch (e) {
      setError(e.message || 'Could not generate PDF.')
    } finally {
      setBusy('')
    }
  }

  const compact = size === 'sm' ? 'text-xs' : ''

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={handlePrint} loading={busy === 'print'} disabled={!!busy} className={compact}>
          <PrinterIcon size={16} />
          Print
        </Button>
        <Button variant="secondary" onClick={downloadPNG} loading={busy === 'png'} disabled={!!busy} className={compact}>
          <ImageIcon size={16} />
          Save Image
        </Button>
        <Button variant="secondary" onClick={downloadPDF} loading={busy === 'pdf'} disabled={!!busy} className={compact}>
          <DownloadIcon size={16} />
          Download PDF
        </Button>
      </div>
      {error && <p className="form-error mt-2">{error}</p>}
    </div>
  )
}
