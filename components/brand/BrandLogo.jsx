'use client'

import { useId } from 'react'

// Official AUSAD Innovation Limited brand logo component.
// Recreated with crisp vector SVG geometry so it renders razor-sharp across all
// screen densities, login pages, app shell navigation, and document previews.
//
// Variants:
//   • 'full'  — Complete horizontal lockup (Ai symbol mark + "AUSAD" wordmark + "Innovation Limited" badge).
//   • 'mark'  — The standalone symbol mark (cyan arch/stem + navy chevron + navy dot).
//   • 'tile'  — The symbol mark in white on a rounded gradient tile (for sidebar & mobile headers).

const CYAN = '#00C4FE'
const NAVY = '#06155E'
const GRAD_MID = '#062270'
const GRAD_END = '#02092E'
const TILE_MID = '#07338C'
const TILE_END = '#030E40'

export default function BrandLogo({
  variant = 'full',
  height,
  className,
  style,
  title = 'AUSAD Innovation Limited',
}) {
  const uid = useId().replace(/:/g, '')
  const badgeGid = `ausadBadgeGrad-${uid}`
  const tileGid = `ausadTileGrad-${uid}`

  if (variant === 'tile') {
    const h = height ?? 32
    return (
      <svg
        role="img"
        aria-label={title}
        width={h}
        height={h}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
      >
        <defs>
          <linearGradient id={tileGid} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={CYAN} />
            <stop offset="50%" stopColor={TILE_MID} />
            <stop offset="100%" stopColor={TILE_END} />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill={`url(#${tileGid})`} />
        <g transform="translate(7, 6) scale(0.50)">
          {/* White Arch & i-stem */}
          <path
            d="M 16,45 C 16,19 36,8 60,8 C 84,8 98,19 98,42 C 98,56 90,66 80,66 C 75,66 71,63 67,58 L 62,50"
            fill="none"
            stroke="#ffffff"
            strokeWidth="11.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* White Chevron (A) */}
          <path
            d="M 21,68 L 43,36 L 65,68"
            fill="none"
            stroke="#ffffff"
            strokeWidth="11.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* White Dot (i) */}
          <circle cx="59.5" cy="25" r="6.6" fill="#ffffff" />
        </g>
      </svg>
    )
  }

  if (variant === 'mark') {
    const h = height ?? 36
    return (
      <svg
        role="img"
        aria-label={title}
        width={h}
        height={h}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
      >
        <g transform="translate(-3, 10)">
          {/* Cyan Arch & i-stem */}
          <path
            d="M 16,45 C 16,19 36,8 60,8 C 84,8 98,19 98,42 C 98,56 90,66 80,66 C 75,66 71,63 67,58 L 62,50"
            fill="none"
            stroke={CYAN}
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Navy Chevron (A) */}
          <path
            d="M 21,68 L 43,36 L 65,68"
            fill="none"
            stroke={NAVY}
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Navy Dot (i) */}
          <circle cx="59.5" cy="25" r="6.2" fill={NAVY} />
        </g>
      </svg>
    )
  }

  // Full horizontal lockup (default)
  const h = height ?? 44
  return (
    <svg
      role="img"
      aria-label={title}
      height={h}
      viewBox="0 0 320 84"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: '100%', ...style }}
    >
      <defs>
        <linearGradient id={badgeGid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={CYAN} />
          <stop offset="55%" stopColor={GRAD_MID} />
          <stop offset="100%" stopColor={GRAD_END} />
        </linearGradient>
      </defs>

      {/* Ai Symbol Mark */}
      <g transform="translate(2, 4)">
        {/* Cyan Arch & i-stem */}
        <path
          d="M 16,45 C 16,19 36,8 60,8 C 84,8 98,19 98,42 C 98,56 90,66 80,66 C 75,66 71,63 67,58 L 62,50"
          fill="none"
          stroke={CYAN}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Navy Chevron (A) */}
        <path
          d="M 21,68 L 43,36 L 65,68"
          fill="none"
          stroke={NAVY}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Navy Dot (i) */}
        <circle cx="59.5" cy="25" r="6.2" fill={NAVY} />
      </g>

      {/* AUSAD Wordmark */}
      <text
        x="116"
        y="47"
        fontFamily="var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="49"
        fontWeight="900"
        letterSpacing="1"
        fill={NAVY}
      >
        AUSAD
      </text>

      {/* Innovation Limited Badge */}
      <rect x="104" y="55" width="208" height="23.5" rx="4" fill={`url(#${badgeGid})`} />
      <text
        x="208"
        y="72"
        textAnchor="middle"
        fontFamily="var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="13.5"
        fontWeight="700"
        letterSpacing="0.4"
        fill="#ffffff"
      >
        Innovation Limited
      </text>
    </svg>
  )
}
