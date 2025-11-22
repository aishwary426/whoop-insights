/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // serverActions is true by default in Next.js 14
  },
  images: {
    domains: ['ioqajwrnwxhczanpkrdp.supabase.co'],
  },
  async rewrites() {
    // In Railway, backend runs on localhost:8000
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
