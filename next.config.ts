import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // SaaSfast M3 — Core stack configuration
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
}

export default nextConfig
