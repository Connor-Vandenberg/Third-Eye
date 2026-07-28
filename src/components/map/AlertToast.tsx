'use client';

import type { SignalEvent } from '@/lib/gzm-client';

/**
 * Alert Toast System
 * Displays convergence threshold alerts as stacking toasts.
 * Auto-dismisses after 8 seconds.
 * Color-coded by severity (convergence_score).
 */

interface AlertToastProps {
  alerts: SignalEvent[];
}

export function AlertToast({ alerts }: AlertToastProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-14 right-4 z-50 space-y-2 pointer-events-none">
      {alerts.map((alert, i) => {
        const severity = alert.convergence_score > 0.8 ? 'critical'
          : alert.convergence_score > 0.6 ? 'high'
          : alert.convergence_score > 0.4 ? 'medium'
          : 'low';

        const colors = {
          critical: 'border-red-500 bg-red-950/90 text-red-200',
          high: 'border-orange-500 bg-orange-950/90 text-orange-200',
          medium: 'border-yellow-500 bg-yellow-950/90 text-yellow-200',
          low: 'border-blue-500 bg-blue-950/90 text-blue-200',
        };

        return (
          <div
            key={`${alert.id}-${i}`}
            className={`pointer-events-auto border-l-4 rounded-r-lg px-3 py-2 backdrop-blur-sm shadow-lg animate-slide-in ${colors[severity]}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                severity === 'critical' ? 'bg-red-400' :
                severity === 'high' ? 'bg-orange-400' :
                severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
              }`} />
              <span className="text-[10px] font-bold uppercase">{severity} CONVERGENCE</span>
            </div>
            <div className="mt-1 text-[10px] opacity-80">
              {alert.int_domain} | Score: {alert.convergence_score.toFixed(2)} | {alert.lat.toFixed(2)}, {alert.lng.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
