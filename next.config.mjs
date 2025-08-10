/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during build (for deployment)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Webpack configuration to handle module loading issues
  webpack: (config, { isServer }) => {
    // Handle OpenTelemetry instrumentation issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Ignore warnings for dynamic requires in Prisma/OpenTelemetry
    config.ignoreWarnings = [
      { module: /node_modules\/@prisma\/instrumentation/ },
      { module: /node_modules\/require-in-the-middle/ },
    ];

    return config;
  },

  // Experimental features for better stability
  experimental: {
    // Enable server components optimization
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;



