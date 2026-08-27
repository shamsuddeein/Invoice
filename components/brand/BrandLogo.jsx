'use client'

import { useId } from 'react'

// AUSAD Innovation Limited brand logo, recreated as vector art so it renders
// crisply everywhere — app chrome, login, and (as the default) on invoices &
// receipts — with no image asset to ship. Inline SVG so html2canvas reproduces it
// faithfully in the "Save Image" / Print capture. Variants:
//   • 'mark'  — the bare gradient arc-and-dot icon (composed into 'full')
//   • 'tile'  — the mark on a rounded gradient tile, drawn in white (chrome tiles)
//   • 'full'  — mark + "AUSAD" wordmark + "Innovation Limited" pill (login, documents)
//
// A logo uploaded in Settings overrides this default at the document render sites;
// removing it reverts to this ("absence = default"). Kept as the single source of
// brand geometry — the same arc path is mirrored in BrandLogoPDF and app/icon.svg.
const CYAN = '#22D3EE'
const BLUE = '#2563EB'
const NAVY = '#1E3A8A'
const FONT = "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"

// Swoosh drawn as a cubic bézier (universally supported — no elliptical-arc command)
// inside a 48×48 box, so DOM and react-pdf render an identical shape.
const MARK_PATH = 'M6 39 C 11 20 27 12 41 15'

export default function BrandLogo({
  variant = 'full',
  height,
  className,
  style,
  title = 'AUSAD Innovation Limited',
}) {
  const uid = useId().replace(/:/g, '')
  const gid = `ausadGrad-${uid}`

  const grad = (
    <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stopColor={CYAN} />
      <stop offset="0.55" stopColor={BLUE} />
      <stop offset="1" stopColor={NAVY} />
    </linearGradient>
  )

  // Arc + dot; colours swap for on-light (gradient arc, navy dot) vs on-dark
  // (white arc + dot, used on the gradient tile).
  const mark = (arcStroke, dotFill) => (
    <>
      <path d={MARK_PATH} fill="none" stroke={arcStroke} strokeWidth="7" strokeLinecap="round" />
      <circle cx="41" cy="11" r="4.6" fill={dotFill} />
    </>
  )

  if (variant === 'tile' || variant === 'mark') {
    const h = height ?? 32
    const onTile = variant === 'tile'
    return (
      <svg
        role="img"
        aria-label={title}
        width={h}
        height={h}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
      >
        <defs>{grad}</defs>
        {onTile && <rect width="48" height="48" rx="12" fill={`url(#${gid})`} />}
        {onTile ? mark('#ffffff', '#ffffff') : mark(`url(#${gid})`, NAVY)}
      </svg>
    )
  }

  // Full horizontal lockup.
  const h = height ?? 40
  return (
    <svg
      role="img"
      aria-label={title}
      height={h}
      viewBox="0 0 205 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>{grad}</defs>
      <g transform="translate(0,8)">{mark(`url(#${gid})`, NAVY)}</g>
      <text x="62" y="33" fontFamily={FONT} fontSize="29" fontWeight="800" letterSpacing="0.5" fill={NAVY}>
        AUSAD
      </text>
      <rect x="62" y="41" width="132" height="19" rx="9.5" fill={NAVY} />
      <text
        x="128"
        y="54.4"
        textAnchor="middle"
        fontFamily={FONT}
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.3"
        fill="#ffffff"
      >
        Innovation Limited
      </text>
    </svg>
  )
}
