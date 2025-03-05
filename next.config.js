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
  // Use standalone output for better compatibility
  output: 'standalone',
  // Disable static generation for error pages
  excludeDefaultMomentLocales: true,
  // Disable static generation for specific paths
  unstable_excludeFiles: ['**/500/**', '**/404/**', '**/error/**', '**/global-error/**']
}

module.exports = nextConfig
