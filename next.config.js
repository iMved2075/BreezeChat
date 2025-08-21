/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration optimized for Next.js 15 with stable Turbopack
  turbopack: {
    // Turbopack specific configurations can go here
  },
  
  // Only use webpack config when not using turbopack
  ...(!process.env.TURBOPACK && {
    webpack: (config, { dev }) => {
      if (dev) {
        // Increase max listeners for development with webpack
        process.setMaxListeners(0);
      }
      return config;
    },
  }),
};

// Set max listeners for turbopack mode
if (process.env.TURBOPACK || process.argv.includes('--turbopack')) {
  process.setMaxListeners(0);
}

module.exports = nextConfig;
