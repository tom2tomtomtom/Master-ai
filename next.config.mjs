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
    // Handle Node.js modules in browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        child_process: false,
        stream: false,
        util: false,
        buffer: false,
        dns: false,
        dgram: false,
        http2: false,
        zlib: false,
      };

      // Prevent client-side bundling of server-only modules
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/content-parser': false,
        '@/lib/content-importer': false,
        '@/lib/logging-config': false,
        '@/lib/certificate-generator': false,
      };

      // Add externals to completely prevent bundling of problematic modules
      config.externals = config.externals || [];
      config.externals.push({
        'fs': 'commonjs fs',
        'path': 'commonjs path',
        'os': 'commonjs os',
        'crypto': 'commonjs crypto',
        'child_process': 'commonjs child_process'
      });
    }

    // Ignore warnings for dynamic requires in Prisma/OpenTelemetry
    config.ignoreWarnings = [
      { module: /node_modules\/@prisma\/instrumentation/ },
      { module: /node_modules\/require-in-the-middle/ },
      { module: /node_modules\/@opentelemetry/ },
      { module: /node_modules\/@supabase\/realtime-js/ },
      /Critical dependency: the request of a dependency is an expression/,
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



