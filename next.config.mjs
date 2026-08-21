/** @type {import('next').NextConfig} */

// Applied to every response. These are the low-risk, high-value headers; a
// full Content-Security-Policy is deliberately left out because Clerk, MUI
// (emotion injects inline <style>) and the S3/data: image sources need to be
// enumerated first, and a wrong CSP breaks the app silently in the browser.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(self), interest-cohort=()',
  },
];

const nextConfig = {
  experimental: {
    serverActions: {
      // `allowedOrigins` is additive to the deployment's own host. Only trust
      // localhost while developing - shipping it to production leaves a
      // browser on the user's own machine able to invoke Server Actions.
      allowedOrigins:
        process.env.NODE_ENV === 'development' ? ['localhost:3000'] : [],
      bodySizeLimit: '100mb', // supports ~50MB video uploads plus processing overhead
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
