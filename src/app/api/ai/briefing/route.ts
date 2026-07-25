/**
 * AI Briefing API Route — Proxies to GZM Backend /aip/brief
 * 
 * Generates proactive intelligence briefings from live graph data.
 */

import { NextRequest, NextResponse } from 'next/server';

const GZM_API = process.env.GZM_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { region } = body as { region?: string };

    const response = await fetch(`${GZM_API}/aip/brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Backend error' }));
      return NextResponse.json(
        { error: error.detail || `Backend returned ${response.status}`, code: 'BACKEND_ERROR' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform to match existing AiAnalyst.tsx briefing format
    return NextResponse.json({
      briefing: data.narrative,
      generatedAt: data.generated_at || new Date().toISOString(),
      // Additional GZM-specific data
      gzm: {
        title: data.title,
        priority: data.priority,
        category: data.category,
        entities_involved: data.entities_involved,
        signals_correlated: data.signals_correlated,
        gaps_identified: data.gaps_identified,
        recommended_actions: data.recommended_actions,
        confidence: data.confidence,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Briefing generation failed';
    
    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'GZM backend not running. Start with: uvicorn api.app:app --port 8000', code: 'BACKEND_OFFLINE' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
