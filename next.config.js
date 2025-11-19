/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // serverActions is true by default in Next.js 14
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  outputFileTracing: false,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:8000/api/v1/:path*',
      },
    ]
  },
}

module.exports = nextConfig
