/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js', 'mammoth']
  },
  // Ensure we're using the Node.js runtime, not Edge
  runtime: 'nodejs',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle node modules that might cause issues
      config.externals = config.externals || []
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse'
      })
    }
    return config
  }
}

export default nextConfig
