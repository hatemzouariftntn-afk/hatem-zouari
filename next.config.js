/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  output: 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return []
  }
}

module.exports = nextConfig

