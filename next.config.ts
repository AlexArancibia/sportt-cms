/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'sporttnest.emetstudio.com', // Dominio que ya tienes configurado
      'cdn.shopify.com',
      'clefast.emetstudio.com' // Añade este dominio
    ],
  },
};

module.exports = nextConfig;
