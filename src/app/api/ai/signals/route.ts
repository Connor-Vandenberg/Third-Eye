/**
 * Signals API Route — Proxies to GZM /aip/signals.
 * Returns active convergence signals for the dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';

const GZM_BACKEND = process.env.GZM_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const hours_back = parseInt(params.get('hours_back') || '24');
  const min_severity = parseFloat(params.get('min_severity') || '0.4');
  const limit = parseInt(params.get('limit') || '50');

  try {
    const resp = await fetch(`${GZM_BACKEND}/aip/signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours_back, min_severity, limit }),
      signal: AbortSignal.timeout(30000),
    });

    if (resp.ok) {
      const data = await resp.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ signals: [], total_count: 0, by_severity: {}, by_type: {}, narrative: 'Backend offline' }, { status: 200 });
  } catch {
    return NextResponse.json({ signals: [], total_count: 0, by_severity: {}, by_type: {}, narrative: 'Connection failed' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resp = await fetch(`${GZM_BACKEND}/aip/signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (resp.ok) {
      return NextResponse.json(await resp.json());
    }
    return NextResponse.json({ signals: [], total_count: 0 }, { status: 200 });
  } catch {
    return NextResponse.json({ signals: [], total_count: 0 }, { status: 200 });
  }
}
