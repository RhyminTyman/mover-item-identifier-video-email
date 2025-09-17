/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '16mb' // Increased to 16MB to support 15MB videos with overhead
    }
  },
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  }
};
export default nextConfig;
