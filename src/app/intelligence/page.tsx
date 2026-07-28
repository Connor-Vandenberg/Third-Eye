import { GzmIntelligenceMap } from '@/components/map/GzmIntelligenceMap';

/**
 * GZM Intelligence Map Page
 * Full-screen tactical intelligence display.
 * Route: /intelligence
 *
 * Features:
 * - 10-INT layer toggles (OSINT, GEOINT, SIGINT, MASINT, HUMINT, CYBER, INFO-OPS, ELINT, IMINT, FINANCIAL)
 * - H3 convergence heatmap (extruded hexagons)
 * - Real-time WebSocket signal streaming
 * - Click-to-task ISR (CBBA allocation)
 * - Tactical HUD (UTC time, signal rate, system health)
 * - Timeline scrubber for temporal playback
 * - Alert toast notifications
 *
 * Connected to:
 * - GZM API (gzm-api:8080) - 82+ AIP tools
 * - GZM ISR (gzm-isr:8087) - CBBA tasking
 * - God's Eye WS (gzm-gods-eye:9090/ws) - real-time signals
 * - GZM GEOINT (gzm-geoint:8080) - NL query
 */

export const metadata = {
  title: 'GZM Intelligence Map | Gray Zone Monitor',
  description: '10-INT convergence visualization with click-to-task ISR',
};

export default function IntelligencePage() {
  return <GzmIntelligenceMap />;
}
