import { NextResponse } from 'next/server';
import { GZM_API_URL } from '@/lib/gzm-config';

/**
 * GET /api/ai/health
 * 
 * Checks GZM backend health status.
 */
export async function GET() {
  try {
    const response = await fetch(`${GZM_API_URL}/aip/health`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'backend_error', backend_url: GZM_API_URL },
        { status: 502 }
      );
    }

    const result = await response.json();
    return NextResponse.json({ ...result, backend_url: GZM_API_URL });
  } catch {
    return NextResponse.json(
      {
        status: 'offline',
        backend_url: GZM_API_URL,
        message: 'GZM backend is not running. Start with: uvicorn api.app:app --reload --port 8000',
      },
      { status: 503 }
    );
  }
}
