import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wosxriwvumvwnjeoeoev.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  experimental: {
    staleTimes: {
      // Keep dynamic at 0 (default) so client-side router cache never serves
      // a stale auth redirect after login. Setting this > 0 causes the
      // unauthenticated /dashboard → /login redirect to be replayed from
      // the cache even after a successful login.
      dynamic: 0,
      static: 180,
    },
  },
  // generateStaticParams: false, // not valid NextConfig property
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
      ],
    },
  ],
};

export default nextConfig;
