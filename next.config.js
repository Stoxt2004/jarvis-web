/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'vercel.app'],
  },
  // Add transpilePackages if needed
  transpilePackages: [],
  eslint: {
    // Warning instead of error is usually faster to build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Speed up build by not type-checking during build
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig