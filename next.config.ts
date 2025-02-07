/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'sporttnest.emetstudio.com', // Dominio que ya tienes configurado
      'cdn.shopify.com',
      'd8ks48oskwsscgkg80so8kkc.161.132.51.242.sslip.io' // Añade este dominio
    ],
  },
};

module.exports = nextConfig;
