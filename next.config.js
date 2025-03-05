/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'erhavrzwpyvnpefifsfu.supabase.co',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'teach-niche.vercel.app'],
    },
  },
  typescript: {
    // Completely disable TypeScript during builds
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip type checking during builds
  skipTypeChecking: true,
  // Skip middleware type checking
  skipMiddlewareUrlNormalize: true,
}

module.exports = nextConfig
