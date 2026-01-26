/** @type {import('next').NextConfig} */
const path = require("path")

const nextConfig = {
  // Evita que Next infiera mal el workspace root (lockfiles múltiples)
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Acepta cualquier dominio
      },
    ],
  },
};

module.exports = nextConfig;
