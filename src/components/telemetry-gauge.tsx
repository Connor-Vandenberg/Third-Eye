'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface GaugeThreshold {
  value: number;
  color: string;
  label?: string;
}

export interface TelemetryGaugeProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
  thresholds?: GaugeThreshold[];
  size?: number;
  animated?: boolean;
  showTicks?: boolean;
  showValue?: boolean;
  showMinMax?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: number;
  pulse?: boolean;
  className?: string;
}

const DEFAULT_THRESHOLDS: GaugeThreshold[] = [
  { value: 0, color: '#10b981', label: 'Normal' },
  { value: 60, color: '#fbbf24', label: 'Warning' },
  { value: 80, color: '#f97316', label: 'High' },
  { value: 90, color: '#ef4444', label: 'Critical' },
];

function getColorForValue(value: number, min: number, max: number, thresholds: GaugeThreshold[]): string {
  const normalizedValue = ((value - min) / (max - min)) * 100;
  let color = thresholds[0]?.color || '#10b981';
  for (const threshold of thresholds) {
    if (normalizedValue >= threshold.value) {
      color = threshold.color;
    }
  }
  return color;
}

export function TelemetryGauge({
  value,
  min = 0,
  max = 100,
  label,
  unit = '',
  thresholds = DEFAULT_THRESHOLDS,
  size = 120,
  animated = true,
  showTicks = true,
  showValue = true,
  showMinMax = true,
  icon,
  subtitle,
  trend,
  pulse = false,
  className = '',
}: TelemetryGaugeProps) {
  const [displayValue, setDisplayValue] = useState(min);
  const prevValueRef = useRef(value);

  // Animate value
  useEffect(() => {
    if (!animated) { setDisplayValue(value); return; }
    const startValue = prevValueRef.current;
    const endValue = value;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (endValue - startValue) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevValueRef.current = value;
  }, [value, animated]);

  const normalizedValue = Math.max(0, Math.min(1, (displayValue - min) / (max - min)));
  const currentColor = getColorForValue(value, min, max, thresholds);

  // Gauge geometry (270 degree arc)
  const startAngle = -225;
  const endAngle = 45;
  const totalAngle = endAngle - startAngle;
  const valueAngle = startAngle + normalizedValue * totalAngle;

  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2 - 8;
  const innerRadius = outerRadius - 12;
  const tickRadius = outerRadius + 2;
  const needleLength = innerRadius - 8;

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (startAng: number, endAng: number, radius: number) => {
    const start = polarToCartesian(endAng, radius);
    const end = polarToCartesian(startAng, radius);
    const largeArc = endAng - startAng > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  // Tick marks
  const tickCount = 10;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const tickValue = min + (i / tickCount) * (max - min);
    const tickAngle = startAngle + (i / tickCount) * totalAngle;
    const outer = polarToCartesian(tickAngle, tickRadius);
    const inner = polarToCartesian(tickAngle, outerRadius - 2);
    const labelPos = polarToCartesian(tickAngle, tickRadius + 8);
    return { value: tickValue, angle: tickAngle, outer, inner, labelPos, isMajor: i % 2 === 0 };
  });

  // Threshold arcs
  const thresholdArcs = thresholds.map((threshold, i) => {
    const nextThreshold = thresholds[i + 1];
    const startNorm = threshold.value / 100;
    const endNorm = nextThreshold ? nextThreshold.value / 100 : 1;
    const arcStart = startAngle + startNorm * totalAngle;
    const arcEnd = startAngle + endNorm * totalAngle;
    return { ...threshold, arcStart, arcEnd };
  });

  // Needle endpoint
  const needleEnd = polarToCartesian(valueAngle, needleLength);
  const needleBase1 = polarToCartesian(valueAngle - 90, 4);
  const needleBase2 = polarToCartesian(valueAngle + 90, 4);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {/* Background arc */}
          <path
            d={describeArc(startAngle, endAngle, outerRadius)}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Threshold colored arcs */}
          {thresholdArcs.map((t, i) => (
            <path
              key={i}
              d={describeArc(t.arcStart, t.arcEnd, outerRadius)}
              fill="none"
              stroke={t.color}
              strokeWidth="12"
              strokeLinecap="butt"
              opacity="0.2"
            />
          ))}

          {/* Active value arc */}
          <motion.path
            d={describeArc(startAngle, valueAngle, outerRadius)}
            fill="none"
            stroke={currentColor}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: animated ? 0.8 : 0, ease: 'easeOut' }}
          />

          {/* Glow effect */}
          <path
            d={describeArc(startAngle, valueAngle, outerRadius)}
            fill="none"
            stroke={currentColor}
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.15"
            filter="blur(4px)"
          />

          {/* Tick marks */}
          {showTicks && ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.inner.x} y1={tick.inner.y}
                x2={tick.outer.x} y2={tick.outer.y}
                stroke={tick.isMajor ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}
                strokeWidth={tick.isMajor ? 1.5 : 0.5}
              />
              {tick.isMajor && size >= 100 && (
                <text
                  x={tick.labelPos.x} y={tick.labelPos.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="7" fill="rgba(255,255,255,0.4)" fontFamily="monospace"
                >
                  {Math.round(tick.value)}
                </text>
              )}
            </g>
          ))}

          {/* Needle */}
          <motion.polygon
            points={`${needleEnd.x},${needleEnd.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
            fill={currentColor}
            opacity="0.9"
            initial={{ rotate: startAngle }}
            animate={{ rotate: 0 }}
            transition={{ duration: animated ? 0.8 : 0 }}
          />

          {/* Center dot */}
          <circle cx={cx} cy={cy} r="5" fill={currentColor} />
          <circle cx={cx} cy={cy} r="3" fill="#18181b" />

          {/* Pulse ring */}
          {pulse && (
            <circle cx={cx} cy={cy} r={outerRadius + 4} fill="none" stroke={currentColor} strokeWidth="1" opacity="0.3">
              <animate attributeName="r" from={outerRadius} to={outerRadius + 12} dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>

        {/* Center value display */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: size * 0.15 }}>
            {icon && <div className="mb-0.5" style={{ color: currentColor }}>{icon}</div>}
            <span className="text-lg font-bold font-mono" style={{ color: currentColor, fontSize: size * 0.16 }}>
              {typeof displayValue === 'number' ? (displayValue < 10 ? displayValue.toFixed(1) : Math.round(displayValue)) : displayValue}
            </span>
            {unit && <span className="text-[8px] text-zinc-500 -mt-0.5">{unit}</span>}
          </div>
        )}
      </div>

      {/* Label */}
      <div className="text-center mt-1">
        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{label}</span>
        {subtitle && <span className="text-[8px] text-zinc-600 block">{subtitle}</span>}
        {trend !== undefined && (
          <span className={`text-[9px] font-mono ${trend > 0 ? 'text-red-400' : trend < 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// Multi-gauge panel for system telemetry
export function TelemetryPanel({ gauges, className = '' }: {
  gauges: Array<TelemetryGaugeProps & { id: string }>;
  className?: string;
}) {
  return (
    <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${Math.min(gauges.length, 6)}, 1fr)` }}>
      {gauges.map((gauge) => (
        <TelemetryGauge key={gauge.id} {...gauge} />
      ))}
    </div>
  );
}

export default TelemetryGauge;
