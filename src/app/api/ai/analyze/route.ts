import { NextRequest, NextResponse } from 'next/server';
import { GZM_API_URL } from '@/lib/gzm-config';

/**
 * POST /api/ai/analyze
 * 
 * Proxies intelligence queries to the GZM backend AIP engine.
 * This replaces the old Gemini-direct call with the full 70+ tool
 * multi-step reasoning engine.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body as { query: string; context?: Record<string, unknown> };

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Call GZM backend AIP engine
    const response = await fetch(`${GZM_API_URL}/aip/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.trim(),
        context: context || {},
        include_raw: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Backend unreachable');
      return NextResponse.json(
        { error: `GZM backend error: ${errorText}`, code: 'BACKEND_ERROR' },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Transform to match the format AiAnalyst.tsx expects
    return NextResponse.json({
      analysis: result.narrative || 'No analysis generated.',
      model: result.model_used || 'GZM AIP Engine',
      timestamp: result.timestamp || new Date().toISOString(),
      // Extra fields the frontend can use
      confidence: result.confidence,
      entities_found: result.entities_found,
      connections_found: result.connections_found,
      follow_ups: result.follow_up_suggestions,
      tokens_used: result.tokens_used,
      intent: result.intent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // If backend is unreachable, give a helpful error
    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      return NextResponse.json(
        {
          error: 'GZM backend is not running. Start it with: uvicorn api.app:app --reload --port 8000',
          code: 'BACKEND_OFFLINE',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
