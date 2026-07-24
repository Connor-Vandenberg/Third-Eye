import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * GZM Security Middleware (proxy.ts equivalent for Next.js 16)
 *
 * Runs on EVERY request before it reaches a route.
 * Responsibilities:
 * - Add security headers dynamically
 * - Rate limit signaling (X-RateLimit headers for monitoring)
 * - Block suspicious request patterns
 * - Reject oversized URLs (DoS prevention)
 *
 * NOTE: This does NOT replace server-side auth validation.
 * Every data-fetching component must ALSO verify auth independently
 * (lesson from CVE-2025-29927).
 */

const MAX_URL_LENGTH = 2048;

// Known malicious patterns to block at the edge
const BLOCKED_PATTERNS = [
  /\.env/i,
  /wp-admin/i,
  /wp-login/i,
  /\.git\//i,
  /\.svn\//i,
  /phpinfo/i,
  /eval\(/i,
  /base64_decode/i,
  /etc\/passwd/i,
  /proc\/self/i,
  /\.\.\//,  // Directory traversal
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullUrl = pathname + search;

  // Block oversized URLs (DoS vector)
  if (fullUrl.length > MAX_URL_LENGTH) {
    return new NextResponse('URI Too Long', { status: 414 });
  }

  // Block known attack patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(fullUrl)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Block the x-middleware-subrequest header (CVE-2025-29927 defense)
  if (request.headers.has('x-middleware-subrequest')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Continue with response
  const response = NextResponse.next();

  // Add security headers that need dynamic values
  response.headers.set('X-Request-ID', crypto.randomUUID());
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
