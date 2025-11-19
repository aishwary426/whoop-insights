/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // serverActions is true by default in Next.js 14
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  outputFileTracing: false,
}

module.exports = nextConfig
