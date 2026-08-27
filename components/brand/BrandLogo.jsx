'use client'

import { useId } from 'react'

// Official AUSAD Innovation Limited brand logo component.
// Pure vector SVG geometry matching the brand master artwork with mathematical precision.
//
// Variants:
//   • 'full' / 'stacked'  — Vertical/stacked lockup (Ai symbol mark on top + "AUSAD" + "Innovation Limited").
//   • 'horizontal'        — Horizontal lockup (Ai symbol mark on left + "AUSAD" & "Innovation Limited" on right).
//   • 'mark'              — The standalone symbol mark (cyan arch/stem + royal blue chevron + dot).
//   • 'tile'              — The symbol mark on a rounded royal blue tile (for sidebar & mobile headers).

const CYAN = '#00CCFF'
const CYAN_TEXT = '#00B4D8'
const BLUE = '#003399'

export default function BrandLogo({
  variant = 'full',
  height,
  className,
  style,
  title = 'AUSAD Innovation Limited',
}) {
  const uid = useId().replace(/:/g, '')
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
            <stop offset="0%" stopColor="#002D88" />
            <stop offset="100%" stopColor="#001850" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill={`url(#${tileGid})`} />
        <g transform="translate(7, 5) scale(0.165)">
          <path
            d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
            fill="none"
            stroke={CYAN}
            strokeWidth="42"
            strokeLinecap="round"
          />
          <line
            x1="168"
            y1="104"
            x2="218"
            y2="194"
            stroke={CYAN}
            strokeWidth="42"
            strokeLinecap="round"
          />
          <path
            d="M 44,178 L 108,90 L 172,178"
            fill="none"
            stroke="#ffffff"
            strokeWidth="42"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="160" cy="68" r="18.5" fill={CYAN} />
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
        <g transform="translate(1, 8) scale(0.32)">
          <path
            d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
            fill="none"
            stroke={CYAN}
            strokeWidth="40"
            strokeLinecap="round"
          />
          <line
            x1="168"
            y1="104"
            x2="218"
            y2="194"
            stroke={CYAN}
            strokeWidth="40"
            strokeLinecap="round"
          />
          <path
            d="M 44,178 L 108,90 L 172,178"
            fill="none"
            stroke={BLUE}
            strokeWidth="40"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="160" cy="68" r="17.5" fill={BLUE} />
        </g>
      </svg>
    )
  }

  if (variant === 'horizontal') {
    const h = height ?? 44
    return (
      <svg
        role="img"
        aria-label={title}
        height={h}
        viewBox="0 0 340 90"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: '100%', ...style }}
      >
        <g transform="translate(4, 2) scale(0.38)">
          <path
            d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
            fill="none"
            stroke={CYAN}
            strokeWidth="40"
            strokeLinecap="round"
          />
          <line
            x1="168"
            y1="104"
            x2="218"
            y2="194"
            stroke={CYAN}
            strokeWidth="40"
            strokeLinecap="round"
          />
          <path
            d="M 44,178 L 108,90 L 172,178"
            fill="none"
            stroke={BLUE}
            strokeWidth="40"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="160" cy="68" r="17.5" fill={BLUE} />
        </g>
        <text
          x="126"
          y="48"
          fontFamily="var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, sans-serif"
          fontSize="44"
          fontWeight="900"
          letterSpacing="0"
          fill={BLUE}
        >
          AUSAD
        </text>
        <text
          x="127"
          y="74"
          fontFamily="var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, sans-serif"
          fontSize="17"
          fontWeight="700"
          letterSpacing="0.2"
          fill={CYAN_TEXT}
        >
          Innovation Limited
        </text>
      </svg>
    )
  }

  // Full Stacked lockup (default)
  const h = height ?? 130
  return (
    <svg
      role="img"
      aria-label={title}
      height={h}
      viewBox="0 0 306 306"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: '100%', ...style }}
    >
      <g id="mark">
        {/* Outer Cyan Arch Dome */}
        <path
          d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
          fill="none"
          stroke={CYAN}
          strokeWidth="40"
          strokeLinecap="round"
        />

        {/* Cyan Diagonal Pill (i stem) */}
        <line
          x1="168"
          y1="104"
          x2="218"
          y2="194"
          stroke={CYAN}
          strokeWidth="40"
          strokeLinecap="round"
        />

        {/* Royal Blue Chevron (A) */}
        <path
          d="M 44,178 L 108,90 L 172,178"
          fill="none"
          stroke={BLUE}
          strokeWidth="40"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Royal Blue Dot (i head) */}
        <circle cx="160" cy="68" r="17.5" fill={BLUE} />
      </g>

      {/* AUSAD Wordmark */}
      <text
        x="153"
        y="248"
        textAnchor="middle"
        fontFamily="var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="58"
        fontWeight="900"
        letterSpacing="0"
        fill={BLUE}
      >
        AUSAD
      </text>

      {/* Innovation Limited Subtitle */}
      <text
        x="153"
        y="284"
        textAnchor="middle"
        fontFamily="var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="24.5"
        fontWeight="700"
        letterSpacing="0.1"
        fill={CYAN_TEXT}
      >
        Innovation Limited
      </text>
    </svg>
  )
}
