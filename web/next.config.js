/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static page generation during build to avoid API fetch errors
  output: 'standalone',
  // Ensure pages are rendered on demand
  reactStrictMode: true,
}

module.exports = nextConfig
