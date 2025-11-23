/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: false,
  experimental: {
    // serverActions is true by default in Next.js 14
  },
  images: {
    domains: ['ioqajwrnwxhczanpkrdp.supabase.co'],
  },
  webpack: (config, { isServer }) => {
    // Ensure Supabase modules are properly resolved
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  async rewrites() {
    // Use 127.0.0.1 instead of localhost to avoid IPv6 (::1) resolution issues
    // This works for both Railway and Render where backend runs on same container
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
