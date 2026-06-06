import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // SaaSfast M3 — Core stack configuration
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', process.env.NEXT_PUBLIC_APP_URL ?? ''].filter(Boolean),
    },
  },
}

export default nextConfig
