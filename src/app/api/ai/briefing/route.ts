import { NextRequest, NextResponse } from 'next/server';
import { GZM_API_URL } from '@/lib/gzm-config';

/**
 * POST /api/ai/briefing
 * 
 * Generates a proactive intelligence brief from the GZM backend.
 * Uses gap detection, signal correlation, and LLM synthesis.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { context, region } = body as { context?: Record<string, unknown>; region?: string };

    // Call GZM backend brief generation
    const response = await fetch(`${GZM_API_URL}/aip/brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region: region || null }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Backend unreachable');
      return NextResponse.json(
        { error: `GZM backend error: ${errorText}`, code: 'BACKEND_ERROR' },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Transform to match format AiAnalyst.tsx expects for briefings
    return NextResponse.json({
      briefing: result.narrative || 'No briefing generated.',
      generatedAt: result.generated_at || new Date().toISOString(),
      // Extra context
      title: result.title,
      priority: result.priority,
      entities_involved: result.entities_involved,
      gaps_identified: result.gaps_identified,
      recommended_actions: result.recommended_actions,
      confidence: result.confidence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'GZM backend is not running. Start it with: uvicorn api.app:app --reload --port 8000', code: 'BACKEND_OFFLINE' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
