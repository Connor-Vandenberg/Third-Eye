/**
 * Signal Decoder Web Worker
 * Runs off the main thread to decode incoming WebSocket binary frames.
 * Converts ArrayBuffer -> typed SignalEvent[] without blocking UI rendering.
 *
 * Protocol:
 * - Incoming: ArrayBuffer (binary-packed signal events)
 * - Outgoing: SignalEvent[] (structured data for deck.gl)
 *
 * Binary format (per event, 48 bytes):
 * [0-15]  id (16 bytes UTF-8 padded)
 * [16-19] lat (float32)
 * [20-23] lng (float32)
 * [24-27] confidence (float32)
 * [28-31] convergence_score (float32)
 * [32-35] timestamp (uint32, seconds since epoch)
 * [36]    type (uint8: 0=signal, 1=entity_move, 2=alert, 3=prediction)
 * [37]    int_domain (uint8: 0-9 mapping to INT domains)
 * [38-47] reserved
 */

const INT_DOMAIN_MAP: string[] = [
  'OSINT', 'GEOINT', 'SIGINT', 'MASINT', 'HUMINT',
  'CYBER', 'INFO-OPS', 'ELINT', 'IMINT', 'FINANCIAL',
];

const TYPE_MAP: string[] = ['signal', 'entity_move', 'alert', 'prediction'];

interface DecodedSignal {
  id: string;
  type: string;
  timestamp: string;
  lat: number;
  lng: number;
  int_domain: string;
  confidence: number;
  convergence_score: number;
}

function decodeBinaryFrame(buffer: ArrayBuffer): DecodedSignal[] {
  const RECORD_SIZE = 48;
  const count = Math.floor(buffer.byteLength / RECORD_SIZE);
  const view = new DataView(buffer);
  const decoder = new TextDecoder('utf-8');
  const results: DecodedSignal[] = [];

  for (let i = 0; i < count; i++) {
    const offset = i * RECORD_SIZE;

    // Decode ID (16 bytes, null-padded UTF-8)
    const idBytes = new Uint8Array(buffer, offset, 16);
    const nullIdx = idBytes.indexOf(0);
    const id = decoder.decode(idBytes.slice(0, nullIdx > 0 ? nullIdx : 16));

    const lat = view.getFloat32(offset + 16, true);
    const lng = view.getFloat32(offset + 20, true);
    const confidence = view.getFloat32(offset + 24, true);
    const convergence_score = view.getFloat32(offset + 28, true);
    const timestampSec = view.getUint32(offset + 32, true);
    const typeIdx = view.getUint8(offset + 36);
    const domainIdx = view.getUint8(offset + 37);

    results.push({
      id,
      type: TYPE_MAP[typeIdx] || 'signal',
      timestamp: new Date(timestampSec * 1000).toISOString(),
      lat,
      lng,
      int_domain: INT_DOMAIN_MAP[domainIdx] || 'OSINT',
      confidence: Math.max(0, Math.min(1, confidence)),
      convergence_score: Math.max(0, Math.min(1, convergence_score)),
    });
  }

  return results;
}

// Also handle JSON fallback for non-binary WebSocket messages
function decodeJsonFrame(data: string): DecodedSignal[] {
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    return [];
  }
}

// Worker message handler
self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'decode_binary': {
      const signals = decodeBinaryFrame(payload as ArrayBuffer);
      self.postMessage({ type: 'decoded', signals });
      break;
    }
    case 'decode_json': {
      const signals = decodeJsonFrame(payload as string);
      self.postMessage({ type: 'decoded', signals });
      break;
    }
    case 'build_binary_attributes': {
      // Build Float32Array for direct GPU upload (deck.gl binary attributes)
      const events = payload as DecodedSignal[];
      const positions = new Float32Array(events.length * 3);
      const colors = new Uint8Array(events.length * 4);
      const radii = new Float32Array(events.length);

      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        positions[i * 3] = e.lng;
        positions[i * 3 + 1] = e.lat;
        positions[i * 3 + 2] = 0;

        // Color by convergence score
        const score = e.convergence_score;
        if (score < 0.33) {
          colors[i * 4] = Math.round((score / 0.33) * 255);
          colors[i * 4 + 1] = 255;
          colors[i * 4 + 2] = 0;
        } else if (score < 0.66) {
          colors[i * 4] = 255;
          colors[i * 4 + 1] = Math.round(255 - ((score - 0.33) / 0.33) * 128);
          colors[i * 4 + 2] = 0;
        } else {
          colors[i * 4] = 255;
          colors[i * 4 + 1] = Math.round(127 - ((score - 0.66) / 0.34) * 127);
          colors[i * 4 + 2] = 0;
        }
        colors[i * 4 + 3] = 220;

        radii[i] = 4 + e.confidence * 16;
      }

      self.postMessage(
        {
          type: 'binary_attributes',
          positions: positions.buffer,
          colors: colors.buffer,
          radii: radii.buffer,
          count: events.length,
        },
        // Transfer buffers (zero-copy)
        [positions.buffer, colors.buffer, radii.buffer]
      );
      break;
    }
  }
};
