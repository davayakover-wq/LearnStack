import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { QueryProvider } from '@/components/shared/query-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// NEXT_PUBLIC_SITE_URL isn't set yet (no production domain until Phase 14 —
// docs/08-roadmap.md); falls back to localhost so metadataBase/OG/sitemap
// URLs still resolve correctly in dev, and Phase 14 only needs to set the
// env var, not touch this code.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const title = 'LearnStack — Learn English & Mathematics';
const description = 'A premium, gamified platform for learning English and Mathematics.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Plain string, not a title.template: every page in the app already sets
  // its own full "X — LearnStack" string (see e.g. dashboard/page.tsx,
  // admin pages) — a template would double-suffix every one of them.
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'LearnStack',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
