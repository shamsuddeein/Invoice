// Client-only download helpers. html2canvas is heavy and DOM-dependent, so it's
// dynamically imported inside the handler (never in the server bundle).

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so the download has grabbed the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Rasterize a DOM node to a PNG at 2× for crisp WhatsApp sharing (doc §10).
export async function downloadNodePNG(node, filename) {
  if (!node) throw new Error('Nothing to capture.')
  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    windowWidth: node.scrollWidth,
  })
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not render image.')
  downloadBlob(blob, filename)
}

// Print a document node via a hidden iframe. The preview uses inline styles, so
// cloning outerHTML reproduces it exactly — we inject the self-hosted document
// fonts (so the ₦ glyph prints; the default Courier New / system mono lacks it),
// repoint the CSS font vars the preview references, and force color-adjust so the
// green PAID stamp isn't stripped by the browser default.
export async function printNode(node, title) {
  if (!node) throw new Error('Nothing to print.')
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
  })
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow.document
  doc.open()
  doc.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' +
      (title || 'Document') +
      '</title><style>' +
      // Self-host the figure/UI fonts so amounts (₦) render in the print frame.
      '@font-face{font-family:"IBM Plex Mono";src:url("/fonts/IBMPlexMono-Regular.ttf");font-weight:400;font-style:normal;font-display:swap;}' +
      '@font-face{font-family:"IBM Plex Mono";src:url("/fonts/IBMPlexMono-Medium.ttf");font-weight:500;font-style:normal;font-display:swap;}' +
      '@font-face{font-family:"IBM Plex Mono";src:url("/fonts/IBMPlexMono-SemiBold.ttf");font-weight:600;font-style:normal;font-display:swap;}' +
      '@font-face{font-family:"DM Sans";src:url("/fonts/DMSans.ttf");font-weight:400 700;font-style:normal;font-display:swap;}' +
      ':root{--font-dm-sans:"DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      '--font-dm-mono:"IBM Plex Mono",ui-monospace,"Courier New",monospace;}' +
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      'html,body{margin:0;padding:0;background:#fff;}' +
      '@page{margin:12mm;}' +
      '</style></head><body>' +
      node.outerHTML +
      '</body></html>'
  )
  doc.close()

  // Wait for the frame (and the logo image, if any) to be ready before printing.
  await new Promise((resolve) => {
    const imgs = () => Array.from(doc.images || [])
    const ready = () => {
      const list = imgs()
      if (!list.length) return resolve()
      let pending = list.length
      const tick = () => { if (--pending <= 0) resolve() }
      list.forEach((img) => {
        if (img.complete) tick()
        else { img.onload = img.onerror = tick }
      })
      setTimeout(resolve, 800) // safety net
    }
    if (doc.readyState === 'complete') ready()
    else { iframe.onload = () => setTimeout(ready, 50); setTimeout(resolve, 1200) }
  })

  // Wait for the injected @font-face files to load so ₦ prints (bounded so a slow
  // or failed font fetch never blocks the print dialog).
  try {
    if (doc.fonts?.ready) await Promise.race([doc.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
  } catch {
    // ignore — fall through to print with whatever loaded
  }

  const win = iframe.contentWindow
  win.focus()
  win.print()
  setTimeout(() => iframe.remove(), 1000)
}
