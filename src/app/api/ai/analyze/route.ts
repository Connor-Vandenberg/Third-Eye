/**
 * AI Analyze API Route — Proxies to GZM Backend /aip/query
 * 
 * This Next.js API route forwards intelligence queries to the
 * GZM FastAPI backend's AIP Intelligence Engine.
 * 
 * The backend handles:
 * - Multi-step reasoning with tool calling
 * - TigerGraph queries across 14.9M vertices
 * - 70+ tools (graph queries, algorithms, ISR tasking)
 * - LLM synthesis (Claude/GPT/Ollama)
 */

import { NextRequest, NextResponse } from 'next/server';

const GZM_API = process.env.GZM_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required', code: 'MISSING_QUERY' },
        { status: 400 }
      );
    }

    // Forward to GZM backend AIP engine
    const response = await fetch(`${GZM_API}/aip/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        context: context || {},
        include_raw: false,
      }),
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

    // Transform to match existing AiAnalyst.tsx expected format
    return NextResponse.json({
      analysis: data.narrative,
      model: data.model_used || 'gzm-aip',
      timestamp: new Date().toISOString(),
      // Additional GZM-specific data
      gzm: {
        intent: data.intent,
        entities_found: data.entities_found,
        connections_found: data.connections_found,
        confidence: data.confidence,
        tokens_used: data.tokens_used,
        follow_ups: data.follow_up_suggestions,
        graph_result: data.graph_result,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    
    if (message.includes('abort') || message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Analysis timed out. The backend may be processing a complex query.', code: 'TIMEOUT' },
        { status: 504 }
      );
    }

    // If backend is unreachable, return clear error
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
