/**
 * AI Analysis API Route — Proxies to GZM Python Backend.
 * 
 * Priority order:
 * 1. GZM Backend (/aip/query) — full 70+ tool multi-step reasoning
 * 2. Fallback to Gemini if backend is unreachable
 */

import { NextRequest, NextResponse } from 'next/server';

const GZM_BACKEND = process.env.GZM_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // Try GZM Backend first (the real AIP with 70+ tools)
    try {
      const gzmResponse = await fetch(`${GZM_BACKEND}/aip/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          context: context || {},
          include_raw: false,
        }),
        signal: AbortSignal.timeout(120000), // 2 min timeout for multi-step reasoning
      });

      if (gzmResponse.ok) {
        const data = await gzmResponse.json();
        
        // Format response to match what AiAnalyst.tsx expects
        let analysis = data.narrative || 'No analysis generated.';
        
        if (data.entities_found > 0) {
          analysis += `\n\n**${data.entities_found} entities** and **${data.connections_found} connections** found in the graph.`;
        }
        
        if (data.follow_up_suggestions?.length > 0) {
          analysis += '\n\n### Suggested Follow-ups\n' + data.follow_up_suggestions.map((s: string) => `- ${s}`).join('\n');
        }

        if (data.confidence > 0) {
          analysis += `\n\n*Confidence: ${Math.round(data.confidence * 100)}% | Model: ${data.model_used || 'unknown'} | Tokens: ${data.tokens_used || 0}*`;
        }

        return NextResponse.json({
          analysis,
          model: data.model_used || 'GZM AIP',
          timestamp: data.timestamp || new Date().toISOString(),
          source: 'gzm_backend',
          raw: data, // Include raw response for advanced UI usage
        });
      }
    } catch (backendError) {
      console.warn('[AI Route] GZM backend unreachable, falling back:', (backendError as Error).message);
    }

    // Fallback: Use Gemini directly if backend is down
    const geminiKey = request.headers.get('x-gemini-key') || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: 'GZM backend is offline and no Gemini API key available. Start the backend with: uvicorn api.app:app --port 8000', code: 'NO_BACKEND' },
        { status: 503 }
      );
    }

    // Gemini fallback (limited — no graph access)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are an intelligence analyst. Answer this query using the provided context.\n\nQuery: ${query}\n\nContext: ${JSON.stringify(context || {}).slice(0, 4000)}` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      return NextResponse.json({ error: `Gemini error: ${err}`, code: 'GEMINI_ERROR' }, { status: 502 });
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return NextResponse.json({
      analysis: text + '\n\n*⚠ Running in fallback mode (Gemini only). Start GZM backend for full graph-powered analysis.*',
      model: 'gemini-2.0-flash (fallback)',
      timestamp: new Date().toISOString(),
      source: 'gemini_fallback',
    });

  } catch (error) {
    console.error('[AI Route] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal error', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
