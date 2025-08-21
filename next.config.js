/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase the max listeners to prevent the warning
  webpack: (config, { dev }) => {
    if (dev) {
      // Increase max listeners for development
      process.setMaxListeners(0); // 0 means unlimited
    }
    return config;
  },
};

module.exports = nextConfig;
