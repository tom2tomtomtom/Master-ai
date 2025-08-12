/** @type {import('next').NextConfig} */
const nextConfig = {
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
      };
    }
    return config;
  },
  
  // Disable static optimization for pages with session context
  experimental: {
    serverComponentsExternalPackages: ['winston', 'winston-daily-rotate-file'],
  },
};

module.exports = nextConfig;