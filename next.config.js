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
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
    // Add specific rules to ignore if needed
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
  // Use standalone output for better compatibility
  output: 'standalone',
}

module.exports = nextConfig
