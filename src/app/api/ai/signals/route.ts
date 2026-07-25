/**
 * Signals API Route — Proxies to GZM Backend /aip/signals
 * 
 * Returns active convergence signals from the graph.
 * Used by the frontend for real-time signal display on the map.
 */

import { NextRequest, NextResponse } from 'next/server';

const GZM_API = process.env.GZM_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours_back = parseInt(searchParams.get('hours_back') || '48');
    const min_severity = parseFloat(searchParams.get('min_severity') || '0.4');
    const limit = parseInt(searchParams.get('limit') || '50');

    const response = await fetch(`${GZM_API}/aip/signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours_back, min_severity, limit }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend returned ${response.status}`, signals: [], total_count: 0 },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Signal fetch failed', signals: [], total_count: 0, by_severity: {}, by_type: {} },
      { status: 503 }
    );
  }
}
