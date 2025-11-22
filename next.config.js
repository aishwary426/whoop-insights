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
    const apiUrl = process.env.API_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
