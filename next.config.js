/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking during build temporarily
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Optimize for Vercel deployment
  swcMinify: true,
  
  // Handle static generation issues
  experimental: {
    // Handle server components and external packages
    serverComponentsExternalPackages: [
      'winston', 
      'winston-daily-rotate-file',
      '@prisma/client',
      'prisma'
    ],
    // Optimize package imports for problematic modules
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-slot'],
  },
  
  // Webpack configuration to handle Node.js modules
  webpack: (config, { isServer }) => {
    // Handle Node.js modules that shouldn't be bundled for the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        os: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'fs/promises': false,
      };
    }
    
    // Add aliases for problematic modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@radix-ui/react-dialog': require.resolve('@radix-ui/react-dialog'),
    };
    
    return config;
  },
  
  // Image optimization
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;