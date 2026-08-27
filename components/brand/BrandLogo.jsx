'use client'

import { useId } from 'react'

// Official AUSAD Innovation Limited brand logo component.
// Recreated with crisp vector SVG geometry so it renders razor-sharp across all
// screen densities, login pages, app shell navigation, and document previews.
//
// Variants:
//   • 'full' / 'stacked'  — Vertical/stacked lockup (Ai symbol mark on top + "AUSAD" in royal blue + "Innovation Limited" in cyan).
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
        <g transform="translate(9, 7) scale(0.185)">
          {/* Cyan Continuous Arch & i-stem */}
          <path
            d="M 22,106 C 22,48 68,18 125,18 C 182,18 226,48 226,106 C 226,140 206,168 178,168 C 166,168 156,161 146,148 L 136,134"
            fill="none"
            stroke={CYAN}
            strokeWidth="26"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* White Chevron (A) */}
          <path
            d="M 36,156 L 86,84 L 136,156"
            fill="none"
            stroke="#ffffff"
            strokeWidth="26"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Cyan Dot (i) */}
          <circle cx="123" cy="58" r="14.5" fill={CYAN} />
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
        <g transform="translate(2, 6) scale(0.38)">
          <path
            d="M 22,106 C 22,48 68,18 125,18 C 182,18 226,48 226,106 C 226,140 206,168 178,168 C 166,168 156,161 146,148 L 136,134"
            fill="none"
            stroke={CYAN}
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 36,156 L 86,84 L 136,156"
            fill="none"
            stroke={BLUE}
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="123" cy="58" r="13.5" fill={BLUE} />
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
        viewBox="0 0 320 80"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: '100%', ...style }}
      >
        <g transform="translate(6, 6) scale(0.35)">
          <path
            d="M 22,106 C 22,48 68,18 125,18 C 182,18 226,48 226,106 C 226,140 206,168 178,168 C 166,168 156,161 146,148 L 136,134"
            fill="none"
            stroke={CYAN}
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 36,156 L 86,84 L 136,156"
            fill="none"
            stroke={BLUE}
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="123" cy="58" r="13.5" fill={BLUE} />
        </g>
        <text
          x="102"
          y="44"
          fontFamily="var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, sans-serif"
          fontSize="38"
          fontWeight="900"
          letterSpacing="1"
          fill={BLUE}
        >
          AUSAD
        </text>
        <text
          x="103"
          y="66"
          fontFamily="var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, sans-serif"
          fontSize="14.5"
          fontWeight="600"
          letterSpacing="0.3"
          fill={CYAN_TEXT}
        >
          Innovation Limited
        </text>
      </svg>
    )
  }

  // Full Stacked lockup (default)
  const h = height ?? 80
  return (
    <svg
      role="img"
      aria-label={title}
      height={h}
      viewBox="0 0 280 280"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: '100%', ...style }}
    >
      <g transform="translate(15, 12)">
        {/* Cyan Continuous Arch & i-stem */}
        <path
          d="M 22,106 C 22,48 68,18 125,18 C 182,18 226,48 226,106 C 226,140 206,168 178,168 C 166,168 156,161 146,148 L 136,134"
          fill="none"
          stroke={CYAN}
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Royal Blue Chevron (A) */}
        <path
          d="M 36,156 L 86,84 L 136,156"
          fill="none"
          stroke={BLUE}
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Royal Blue Dot (i) */}
        <circle cx="123" cy="58" r="13.5" fill={BLUE} />
      </g>

      {/* AUSAD Wordmark */}
      <text
        x="140"
        y="222"
        textAnchor="middle"
        fontFamily="var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="44"
        fontWeight="900"
        letterSpacing="2"
        fill={BLUE}
      >
        AUSAD
      </text>

      {/* Innovation Limited Subtitle */}
      <text
        x="140"
        y="254"
        textAnchor="middle"
        fontFamily="var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="19"
        fontWeight="600"
        letterSpacing="0.5"
        fill={CYAN_TEXT}
      >
        Innovation Limited
      </text>
    </svg>
  )
}
