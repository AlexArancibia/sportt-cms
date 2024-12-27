/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sporttnest.vps1.emetstudio.com',
        port: '', // Deja vacío si no hay un puerto específico
        pathname: '/uploads/**', // Ajusta el path si es necesario
      },
    ],
  },
};

module.exports = nextConfig;
