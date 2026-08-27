import os
import subprocess
from PIL import Image

def generate_brand_assets():
    # ── 1. Vertical / Stacked Master Logo (Matching the new official artwork) ────
    # ViewBox 280 x 280
    stacked_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" width="560" height="560">
  <!-- Symbol Mark (Top) -->
  <g transform="translate(15, 12)">
    <!-- Cyan Continuous Arch & "i" Stem -->
    <path d="M 22,106 C 22,48 68,18 125,18 C 182,18 226,48 226,106 C 226,140 206,168 178,168 C 166,168 156,161 146,148 L 136,134"
          fill="none" stroke="#00CCFF" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Royal Blue Chevron (A) -->
    <path d="M 36,156 L 86,84 L 136,156"
          fill="none" stroke="#003399" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Royal Blue Dot (i) -->
    <circle cx="123" cy="58" r="13.5" fill="#003399" />
  </g>

  <!-- AUSAD Wordmark -->
  <text x="140" y="222" text-anchor="middle" font-family="'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" letter-spacing="2" fill="#003399">AUSAD</text>

  <!-- Innovation Limited Subtitle -->
  <text x="140" y="254" text-anchor="middle" font-family="'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="600" letter-spacing="0.5" fill="#00CCFF">Innovation Limited</text>
</svg>'''

    # ── 2. Horizontal Brand Lockup (for Invoices, Receipts, Wide Previews) ────────
    # ViewBox 320 x 80
    horizontal_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="640" height="160">
  <!-- Symbol Mark (Left) -->
  <g transform="translate(6, 6) scale(0.35)">
    <!-- Cyan Continuous Arch & "i" Stem -->
    <path d="M 22,106 C 22,48 68,18 125,18 C 182,18 226,48 226,106 C 226,140 206,168 178,168 C 166,168 156,161 146,148 L 136,134"
          fill="none" stroke="#00CCFF" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Royal Blue Chevron (A) -->
    <path d="M 36,156 L 86,84 L 136,156"
          fill="none" stroke="#003399" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Royal Blue Dot (i) -->
    <circle cx="123" cy="58" r="13.5" fill="#003399" />
  </g>

  <!-- Text Group (Right) -->
  <text x="102" y="44" font-family="'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="900" letter-spacing="1" fill="#003399">AUSAD</text>
  <text x="103" y="66" font-family="'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14.5" font-weight="600" letter-spacing="0.3" fill="#00B4D8">Innovation Limited</text>
</svg>'''

    # ── 3. Standalone Symbol Mark (100 x 100) ────────────────────────────────────
    mark_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
  <g transform="translate(2, 6) scale(0.38)">
    <!-- Cyan Continuous Arch & "i" Stem -->
    <path d="M 22,106 C 22,48 68,18 125,18 C 182,18 226,48 226,106 C 226,140 206,168 178,168 C 166,168 156,161 146,148 L 136,134"
          fill="none" stroke="#00CCFF" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Royal Blue Chevron (A) -->
    <path d="M 36,156 L 86,84 L 136,156"
          fill="none" stroke="#003399" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Royal Blue Dot (i) -->
    <circle cx="123" cy="58" r="13.5" fill="#003399" />
  </g>
</svg>'''

    # ── 4. App Tile / Favicon (Mark on rounded dark royal tile) ──────────────────
    tile_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="tileGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#002D88" />
      <stop offset="100%" stop-color="#001850" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#tileGrad)" />
  <g transform="translate(9, 7) scale(0.185)">
    <!-- Cyan Continuous Arch & "i" Stem -->
    <path d="M 22,106 C 22,48 68,18 125,18 C 182,18 226,48 226,106 C 226,140 206,168 178,168 C 166,168 156,161 146,148 L 136,134"
          fill="none" stroke="#00CCFF" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />

    <!-- White Chevron (A) -->
    <path d="M 36,156 L 86,84 L 136,156"
          fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Cyan Dot (i) -->
    <circle cx="123" cy="58" r="14.5" fill="#00CCFF" />
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

    print('Wrote all SVG brand assets')

if __name__ == '__main__':
    generate_brand_assets()
