/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone',
  experimental: {
    // serverActions is true by default in Next.js 14
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/v1/:path*',
          destination: 'http://127.0.0.1:8000/api/v1/:path*',
        },
      ]
    }
    return []
  },
}

module.exports = nextConfig
