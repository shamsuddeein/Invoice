import os
import subprocess
from PIL import Image

def generate_svgs():
    # ── 1. Full Horizontal Brand Lockup ──────────────────────────────
    # ViewBox 320 x 84
    # Mark: x: 8..98, y: 8..76
    # Wordmark "AUSAD": x: 114, y: 47
    # Badge: x: 104, y: 55, width: 206, height: 23, rx: 4
    full_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 84" width="640" height="168">
  <defs>
    <linearGradient id="ausadBadgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00C4FE" />
      <stop offset="55%" stop-color="#062270" />
      <stop offset="100%" stop-color="#02092E" />
    </linearGradient>
    <linearGradient id="ausadTileGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00C4FE" />
      <stop offset="50%" stop-color="#07338C" />
      <stop offset="100%" stop-color="#030E40" />
    </linearGradient>
  </defs>

  <!-- AUSAD Ai Symbol Mark (Left) -->
  <g transform="translate(2, 4)">
    <!-- Cyan Arch Dome -->
    <path d="M 16,45 C 16,19 36,8 60,8 C 84,8 98,19 98,42 C 98,56 90,66 80,66 C 75,66 71,63 67,58 L 62,50"
          fill="none" stroke="#00C4FE" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Navy Chevron "A" -->
    <path d="M 21,68 L 43,36 L 65,68"
          fill="none" stroke="#06155E" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Navy Dot (head of "i") -->
    <circle cx="59.5" cy="25" r="6.2" fill="#06155E" />
  </g>

  <!-- AUSAD Wordmark -->
  <text x="116" y="47" font-family="'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif" font-size="49" font-weight="900" letter-spacing="1" fill="#06155E">AUSAD</text>

  <!-- Innovation Limited Badge -->
  <rect x="104" y="55" width="208" height="23.5" rx="4" fill="url(#ausadBadgeGrad)" />
  <text x="208" y="72" text-anchor="middle" font-family="'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" letter-spacing="0.4" fill="#ffffff">Innovation Limited</text>
</svg>'''

    # ── 2. Mark-Only Icon SVG (100 x 100) ─────────────────────────────
    mark_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
  <g transform="translate(-3, 10)">
    <!-- Cyan Arch Dome -->
    <path d="M 16,45 C 16,19 36,8 60,8 C 84,8 98,19 98,42 C 98,56 90,66 80,66 C 75,66 71,63 67,58 L 62,50"
          fill="none" stroke="#00C4FE" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Navy Chevron "A" -->
    <path d="M 21,68 L 43,36 L 65,68"
          fill="none" stroke="#06155E" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Navy Dot (head of "i") -->
    <circle cx="59.5" cy="25" r="6.2" fill="#06155E" />
  </g>
</svg>'''

    # ── 3. App Tile / Favicon SVG ──────────────────────────────────────
    tile_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="tileGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00C4FE" />
      <stop offset="50%" stop-color="#07338C" />
      <stop offset="100%" stop-color="#030E40" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#tileGrad)" />
  <g transform="translate(7, 6) scale(0.50)">
    <!-- White Arch Dome -->
    <path d="M 16,45 C 16,19 36,8 60,8 C 84,8 98,19 98,42 C 98,56 90,66 80,66 C 75,66 71,63 67,58 L 62,50"
          fill="none" stroke="#ffffff" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- White Chevron "A" -->
    <path d="M 21,68 L 43,36 L 65,68"
          fill="none" stroke="#ffffff" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- White Dot (head of "i") -->
    <circle cx="59.5" cy="25" r="6.6" fill="#ffffff" />
  </g>
</svg>'''

    os.makedirs('public/brand', exist_ok=True)
    with open('public/brand/ausad-logo.svg', 'w', encoding='utf-8') as f:
        f.write(full_svg)
    with open('public/brand/ausad-mark.svg', 'w', encoding='utf-8') as f:
        f.write(mark_svg)
    with open('public/brand/ausad-tile.svg', 'w', encoding='utf-8') as f:
        f.write(tile_svg)
    with open('app/icon.svg', 'w', encoding='utf-8') as f:
        f.write(tile_svg)

    print('Wrote SVG brand files')

if __name__ == '__main__':
    generate_svgs()
