import path from 'node:path';
import type { NextConfig } from 'next';

// Lesson/quiz prompt images and admin-uploaded media live in Supabase
// Storage's public buckets (docs/04-database-schema.md) — allow next/image
// to optimize images served from the project's own Supabase host.
const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
