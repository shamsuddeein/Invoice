import os
import subprocess
from PIL import Image

def generate_brand_assets():
    # ── 1. Master Vertical / Stacked Logo (Exact geometry) ──────────────────────
    # ViewBox 306 x 306
    stacked_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 306 306" width="612" height="612">
  <defs>
    <linearGradient id="stackedInnoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00C4FE" />
      <stop offset="100%" stop-color="#06155E" />
    </linearGradient>
  </defs>

  <g id="mark">
    <!-- Outer Cyan Arch Dome -->
    <path d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
          fill="none" stroke="#00C4FE" stroke-width="40" stroke-linecap="round" />

    <!-- Cyan Diagonal Pill (i stem) -->
    <line x1="168" y1="104" x2="218" y2="194"
          stroke="#00C4FE" stroke-width="40" stroke-linecap="round" />

    <!-- Dark Navy Chevron (A) -->
    <path d="M 44,178 L 108,90 L 172,178"
          fill="none" stroke="#06155E" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Dark Navy Dot (i head) -->
    <circle cx="160" cy="68" r="17.5" fill="#06155E" />
  </g>

  <!-- AUSAD Wordmark -->
  <text x="153" y="248" text-anchor="middle" font-family="'DM Sans', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial Black', sans-serif" font-size="58" font-weight="900" letter-spacing="0" fill="#06155E">AUSAD</text>

  <!-- Innovation Limited Subtitle -->
  <text x="153" y="284" text-anchor="middle" font-family="'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="24.5" font-weight="700" letter-spacing="0.1" fill="#00C4FE">Innovation Limited</text>
</svg>'''

    # ── 2. Master Horizontal Brand Lockup (with Gradient Pill Badge) ─────────────
    # ViewBox 280 x 78
    horizontal_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 78" width="560" height="156">
  <defs>
    <linearGradient id="horizInnoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00C4FE" />
      <stop offset="100%" stop-color="#06155E" />
    </linearGradient>
  </defs>

  <!-- Symbol Mark (Left) -->
  <g transform="translate(3, 2) scale(0.24)">
    <path d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
          fill="none" stroke="#00C4FE" stroke-width="40" stroke-linecap="round" />
    <line x1="168" y1="104" x2="218" y2="194"
          stroke="#00C4FE" stroke-width="40" stroke-linecap="round" />
    <path d="M 44,178 L 108,90 L 172,178"
          fill="none" stroke="#06155E" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="160" cy="68" r="17.5" fill="#06155E" />
  </g>

  <!-- AUSAD Wordmark -->
  <text x="88" y="38" font-family="'DM Sans', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial Black', sans-serif" font-size="44" font-weight="900" letter-spacing="0.5" fill="#06155E">AUSAD</text>

  <!-- Innovation Limited Gradient Pill Badge -->
  <rect x="86" y="47" width="186" height="25" rx="5" fill="url(#horizInnoGrad)" />
  <text x="179" y="64.5" text-anchor="middle" font-family="'DM Sans', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13.2" font-weight="800" letter-spacing="0.2" fill="#ffffff">Innovation Limited</text>
</svg>'''

    # ── 3. Standalone Symbol Mark (100 x 100) ────────────────────────────────────
    mark_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
  <g transform="translate(1, 8) scale(0.32)">
    <path d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
          fill="none" stroke="#00C4FE" stroke-width="40" stroke-linecap="round" />
    <line x1="168" y1="104" x2="218" y2="194"
          stroke="#00C4FE" stroke-width="40" stroke-linecap="round" />
    <path d="M 44,178 L 108,90 L 172,178"
          fill="none" stroke="#06155E" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="160" cy="68" r="17.5" fill="#06155E" />
  </g>
</svg>'''

    # ── 4. App Tile / Favicon (64 x 64) ──────────────────────────────────────────
    tile_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="tileGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#002D88" />
      <stop offset="100%" stop-color="#001850" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#tileGrad)" />
  <g transform="translate(7, 5) scale(0.165)">
    <path d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
          fill="none" stroke="#00CCFF" stroke-width="42" stroke-linecap="round" />
    <line x1="168" y1="104" x2="218" y2="194"
          stroke="#00CCFF" stroke-width="42" stroke-linecap="round" />
    <path d="M 44,178 L 108,90 L 172,178"
          fill="none" stroke="#ffffff" stroke-width="42" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="160" cy="68" r="18.5" fill="#00CCFF" />
  </g>
</svg>'''

    os.makedirs('public/brand', exist_ok=True)
    with open('public/brand/ausad-logo-stacked.svg', 'w', encoding='utf-8') as f:
        f.write(stacked_svg)
    with open('public/brand/ausad-logo.svg', 'w', encoding='utf-8') as f:
        f.write(horizontal_svg)
    with open('public/brand/ausad-mark.svg', 'w', encoding='utf-8') as f:
        f.write(mark_svg)
    with open('public/brand/ausad-tile.svg', 'w', encoding='utf-8') as f:
        f.write(tile_svg)
    with open('app/icon.svg', 'w', encoding='utf-8') as f:
        f.write(tile_svg)

    print('Wrote all SVG master brand assets')

if __name__ == '__main__':
    generate_brand_assets()
