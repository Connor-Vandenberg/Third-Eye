import { NextRequest, NextResponse } from 'next/server';
import { GZM_API_URL } from '@/lib/gzm-config';

/**
 * GET /api/ai/signals
 * 
 * Fetches active convergence signals from the GZM backend.
 * Used by the frontend for real-time signal display.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursBack = parseInt(searchParams.get('hours_back') || '24');
    const minSeverity = parseFloat(searchParams.get('min_severity') || '0.4');
    const limit = parseInt(searchParams.get('limit') || '50');

    const response = await fetch(`${GZM_API_URL}/aip/signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours_back: hoursBack, min_severity: minSeverity, limit }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch signals from GZM backend' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message, signals: [], total_count: 0 },
      { status: 500 }
    );
  }
}
