// Conservative security headers applied to every response. Deliberately no
// Content-Security-Policy: Next's App Router injects inline bootstrap scripts,
// and a strict script-src would need per-request nonces — more risk than value
// for a private single-user app. These headers are the safe, framework-agnostic
// subset that hardens clickjacking / MIME-sniffing / referrer leakage without
// breaking the app.
const securityHeaders = [
  // Disallow being framed anywhere (clickjacking protection).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Don't let browsers MIME-sniff responses away from their declared type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send only the origin on cross-origin navigations; full URL same-origin.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for two years incl. subdomains (ignored by browsers on http://localhost).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Turn off device APIs the app never uses.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework/version in a response header (fingerprinting).
  poweredByHeader: false,
  // @react-pdf/renderer ships modern JS and pulls in fontkit/yoga; transpiling it
  // avoids server-bundle parse errors. The PDF link itself is always loaded client
  // side via next/dynamic({ ssr: false }).
  transpilePackages: ['@react-pdf/renderer'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  webpack: (config) => {
    // Prevent Next from trying to bundle the optional native `canvas` dep that
    // @react-pdf/renderer references but does not require in the browser build.
    config.resolve.alias = { ...config.resolve.alias, canvas: false }
    return config
  },
}

module.exports = nextConfig
