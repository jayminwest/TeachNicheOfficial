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
  // Disable middleware type checking
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'teach-niche.vercel.app'],
    },
    middlewareSourceMaps: false,
  },
}

module.exports = nextConfig
