import { Font } from '@react-pdf/renderer'

// react-pdf's built-in Helvetica/Courier are the base-14 PDF fonts and contain no
// ₦ (naira, U+20A6) glyph, so amounts rendered blank in downloaded PDFs. Register
// IBM Plex Mono (self-hosted from /public/fonts, ₦-capable) for every figure so the
// PDF matches the on-screen preview. Body text stays on Helvetica (no ₦ there).
// Idempotent: safe to call from each PDF component's module scope.
let done = false

export function registerPdfFonts() {
  if (done) return
  done = true
  Font.register({
    family: 'IBM Plex Mono',
    fonts: [
      { src: '/fonts/IBMPlexMono-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/IBMPlexMono-Medium.ttf', fontWeight: 500 },
      { src: '/fonts/IBMPlexMono-SemiBold.ttf', fontWeight: 600 },
    ],
  })
}
