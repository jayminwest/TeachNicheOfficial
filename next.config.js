/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'erhavrzwpyvnpefifsfu.supabase.co',
    ],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
