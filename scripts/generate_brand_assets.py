import os
import subprocess
from PIL import Image

def generate_brand_assets():
    # ── 1. Master Vertical / Stacked Logo (Exact geometry) ──────────────────────
    # ViewBox 306 x 306
    stacked_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 306 306" width="612" height="612">
  <g id="mark">
    <!-- Outer Cyan Arch Dome -->
    <path d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
          fill="none" stroke="#00CCFF" stroke-width="40" stroke-linecap="round" />

    <!-- Cyan Diagonal Pill (i stem) -->
    <line x1="168" y1="104" x2="218" y2="194"
          stroke="#00CCFF" stroke-width="40" stroke-linecap="round" />

    <!-- Royal Blue Chevron (A) -->
    <path d="M 44,178 L 108,90 L 172,178"
          fill="none" stroke="#003399" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Royal Blue Dot (i head) -->
    <circle cx="160" cy="68" r="17.5" fill="#003399" />
  </g>

  <!-- AUSAD Wordmark -->
  <text x="153" y="248" text-anchor="middle" font-family="'DM Sans', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="58" font-weight="900" letter-spacing="0" fill="#003399">AUSAD</text>

  <!-- Innovation Limited Subtitle -->
  <text x="153" y="284" text-anchor="middle" font-family="'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="24.5" font-weight="700" letter-spacing="0.1" fill="#00CCFF">Innovation Limited</text>
</svg>'''

    # ── 2. Horizontal Brand Lockup (for Invoices, Receipts, Wide Previews) ────────
    # ViewBox 340 x 90
    horizontal_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 90" width="680" height="180">
  <!-- Symbol Mark (Left) -->
  <g transform="translate(4, 2) scale(0.38)">
    <path d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
          fill="none" stroke="#00CCFF" stroke-width="40" stroke-linecap="round" />
    <line x1="168" y1="104" x2="218" y2="194"
          stroke="#00CCFF" stroke-width="40" stroke-linecap="round" />
    <path d="M 44,178 L 108,90 L 172,178"
          fill="none" stroke="#003399" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="160" cy="68" r="17.5" fill="#003399" />
  </g>

  <!-- Text Group (Right) -->
  <text x="126" y="48" font-family="'DM Sans', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="44" font-weight="900" letter-spacing="0" fill="#003399">AUSAD</text>
  <text x="127" y="74" font-family="'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="17" font-weight="700" letter-spacing="0.2" fill="#00B4D8">Innovation Limited</text>
</svg>'''

    # ── 3. Standalone Symbol Mark (100 x 100) ────────────────────────────────────
    mark_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
  <g transform="translate(1, 8) scale(0.32)">
    <path d="M 36,134 C 36,54 88,24 153,24 C 226,24 284,60 284,130 C 284,170 256,194 218,194"
          fill="none" stroke="#00CCFF" stroke-width="40" stroke-linecap="round" />
    <line x1="168" y1="104" x2="218" y2="194"
          stroke="#00CCFF" stroke-width="40" stroke-linecap="round" />
    <path d="M 44,178 L 108,90 L 172,178"
          fill="none" stroke="#003399" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="160" cy="68" r="17.5" fill="#003399" />
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
