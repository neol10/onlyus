let withPWA = (config) => config
try {
  const pwa = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV !== 'production',
  })
  withPWA = pwa
} catch (err) {
  console.warn('next-pwa not available — continuing without PWA support')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = withPWA(nextConfig)
