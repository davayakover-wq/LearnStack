import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// File and export both named `proxy` per Next.js 16's renamed convention
// (formerly `middleware.ts` / `export function middleware`) — same runtime
// behavior.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
