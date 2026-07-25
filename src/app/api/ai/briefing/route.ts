/**
 * Intelligence Briefing API Route — Proxies to GZM /aip/brief.
 */

import { NextRequest, NextResponse } from 'next/server';

const GZM_BACKEND = process.env.GZM_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const region = (body as Record<string, unknown>).region as string | undefined;

    // Try GZM backend
    try {
      const resp = await fetch(`${GZM_BACKEND}/aip/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region }),
        signal: AbortSignal.timeout(60000),
      });

      if (resp.ok) {
        const data = await resp.json();
        
        let briefing = `# ${data.title || 'Intelligence Brief'}\n\n`;
        briefing += data.narrative || 'No briefing generated.';
        
        if (data.entities_involved?.length > 0) {
          briefing += '\n\n### Key Entities\n' + data.entities_involved.map((e: string) => `- ${e}`).join('\n');
        }
        if (data.gaps_identified?.length > 0) {
          briefing += '\n\n### Intelligence Gaps\n' + data.gaps_identified.map((g: string) => `- ${g}`).join('\n');
        }
        if (data.recommended_actions?.length > 0) {
          briefing += '\n\n### Recommended Actions\n' + data.recommended_actions.map((a: string) => `- ${a}`).join('\n');
        }

        return NextResponse.json({
          briefing,
          generatedAt: data.generated_at || new Date().toISOString(),
          source: 'gzm_backend',
        });
      }
    } catch (e) {
      console.warn('[Briefing Route] Backend unreachable:', (e as Error).message);
    }

    return NextResponse.json(
      { error: 'GZM backend offline. Start with: uvicorn api.app:app --port 8000', code: 'NO_BACKEND' },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
