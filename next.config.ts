/** @type {import('next').NextConfig} */
const nextConfig = {
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
