import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Only the public marketing/auth routes are worth crawling — everything
// under (app)/(admin) requires a session and just redirects anonymous
// crawlers to /login anyway.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/learn',
        '/review',
        '/stats',
        '/profile',
        '/quiz',
        '/admin',
        '/api',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
