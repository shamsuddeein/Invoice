/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer ships modern JS and pulls in fontkit/yoga; transpiling it
  // avoids server-bundle parse errors. The PDF link itself is always loaded client
  // side via next/dynamic({ ssr: false }).
  transpilePackages: ['@react-pdf/renderer'],
  webpack: (config) => {
    // Prevent Next from trying to bundle the optional native `canvas` dep that
    // @react-pdf/renderer references but does not require in the browser build.
    config.resolve.alias = { ...config.resolve.alias, canvas: false }
    return config
  },
}

module.exports = nextConfig
