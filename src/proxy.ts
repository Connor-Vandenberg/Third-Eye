import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const url = request.nextUrl.pathname;
  
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown GZM Client';
  
  const basePayload = {
    hostname: request.nextUrl.hostname,
    language: "en-US",
    referrer: request.headers.get('referer') || "",
    screen: "1920x1080",
    title: "Gray Zone Monitor",
    url: url,
    website: process.env.UMAMI_WEBSITE_ID || ""
  };

  // Only send analytics if Umami is configured
  if (process.env.UMAMI_URL) {
    const pageView = fetch(`${process.env.UMAMI_URL}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': userAgent, 'x-forwarded-for': ip },
      body: JSON.stringify({ payload: basePayload, type: "event" })
    }).catch(() => {});

    event.waitUntil(pageView);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
