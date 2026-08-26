import localFont from 'next/font/local'
import './globals.css'

// UI font — DM Sans (variable). Self-hosted so it renders identically offline and
// in production with no runtime Google Fonts fetch.
const dmSans = localFont({
  src: '../public/fonts/DMSans.woff2',
  weight: '400 700',
  variable: '--font-dm-sans',
  display: 'swap',
})

// Money / tabular figures use IBM Plex Mono — NOT DM Mono. DM Mono has no ₦ (naira)
// glyph, so every amount fell back to a system font and rendered with a strike-like
// artifact; the PDF's Courier lacks it too. (Google's `latin` subset would drop ₦
// regardless, which is why the full font is self-hosted here.) Served as woff2 for
// the app UI — ~70% smaller than the TTF and loaded on every page. The TTF copies
// remain in public/fonts for document export only: react-pdf (pdf-fonts.js) can't
// read woff2. Kept on the --font-dm-mono CSS variable so all .mono/.amount usages
// switch centrally. Weights: 400 for figures in tables, 500/600 for emphasised amounts.
const dmMono = localFont({
  src: [
    { path: '../public/fonts/IBMPlexMono-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/IBMPlexMono-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/IBMPlexMono-SemiBold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata = {
  title: 'Invoices',
  description: 'Invoice & receipt manager',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
