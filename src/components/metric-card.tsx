'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle,
  XCircle, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface SparklinePoint {
  value: number;
  timestamp?: string;
}

interface ThresholdConfig {
  warning: number;
  critical: number;
  direction: 'above' | 'below';
}

export interface MetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  unit?: string;
  format?: 'number' | 'percent' | 'duration' | 'currency' | 'compact';
  sparklineData?: SparklinePoint[];
  trend?: 'up' | 'down' | 'stable';
  trendLabel?: string;
  delta?: number;
  deltaLabel?: string;
  threshold?: ThresholdConfig;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
  loading?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  lastUpdated?: string;
  target?: number;
  pulse?: boolean;
}

function formatValue(value: number | string, format?: string, unit?: string): string {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'percent': return `${value.toFixed(1)}%`;
    case 'duration': {
      if (value < 60) return `${value.toFixed(0)}s`;
      if (value < 3600) return `${(value / 60).toFixed(1)}m`;
      return `${(value / 3600).toFixed(1)}h`;
    }
    case 'currency': return `$${value.toLocaleString()}`;
    case 'compact': {
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
      return value.toFixed(0);
    }
    default: return typeof value === 'number' ? value.toLocaleString() : String(value);
  }
}

function Sparkline({ data, color, width = 100, height = 32, threshold }: {
  data: SparklinePoint[];
  color: string;
  width?: number;
  height?: number;
  threshold?: ThresholdConfig;
}) {
  if (!data || data.length < 2) return null;

  const values = data.map(d => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const padding = 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`sparkline-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Threshold line */}
      {threshold && (
        <line
          x1={0}
          y1={padding + (1 - (threshold.warning - min) / range) * (height - padding * 2)}
          x2={width}
          y2={padding + (1 - (threshold.warning - min) / range) * (height - padding * 2)}
          stroke="#fbbf24"
          strokeWidth="0.5"
          strokeDasharray="3,3"
          opacity="0.5"
        />
      )}

      {/* Area */}
      <path d={areaD} fill={`url(#sparkline-grad-${color.replace('#', '')})`} />

      {/* Line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* Current value dot */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2.5"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5 }}
      />
    </svg>
  );
}

export function MetricCard({
  title,
  value,
  previousValue,
  unit,
  format,
  sparklineData,
  trend,
  trendLabel,
  delta,
  deltaLabel,
  threshold,
  icon,
  color = '#3b82f6',
  subtitle,
  loading = false,
  animated = true,
  size = 'md',
  className = '',
  onClick,
  lastUpdated,
  target,
  pulse = false,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(typeof value === 'number' ? 0 : value);
  const prevValueRef = useRef(value);
  const [flash, setFlash] = useState(false);

  // Animate number counting
  useEffect(() => {
    if (typeof value !== 'number' || !animated) {
      setDisplayValue(value);
      return;
    }

    const startValue = typeof prevValueRef.current === 'number' ? prevValueRef.current : 0;
    const endValue = value;
    const duration = 1000;
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

  // Flash on value change
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }
  }, [value]);

  // Determine status from threshold
  const getStatus = (): 'normal' | 'warning' | 'critical' => {
    if (!threshold || typeof value !== 'number') return 'normal';
    if (threshold.direction === 'above') {
      if (value >= threshold.critical) return 'critical';
      if (value >= threshold.warning) return 'warning';
    } else {
      if (value <= threshold.critical) return 'critical';
      if (value <= threshold.warning) return 'warning';
    }
    return 'normal';
  };

  const status = getStatus();
  const statusColors = {
    normal: color,
    warning: '#fbbf24',
    critical: '#ef4444',
  };
  const activeColor = statusColors[status];

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const computedDelta = delta !== undefined ? delta : (typeof value === 'number' && previousValue !== undefined ? ((value - previousValue) / previousValue) * 100 : undefined);

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`relative bg-zinc-900/70 backdrop-blur-xl border border-zinc-700/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-600/50 ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${sizeClasses[size]} ${className}`}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {/* Flash overlay on change */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-xl"
            style={{ backgroundColor: activeColor }}
          />
        )}
      </AnimatePresence>

      {/* Pulse indicator */}
      {pulse && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: activeColor }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: activeColor }} />
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className="text-zinc-400">{icon}</div>}
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">{title}</span>
        </div>
        {status !== 'normal' && (
          <div className="flex items-center gap-1">
            {status === 'critical' ? <XCircle className="w-3.5 h-3.5 text-red-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className={`${valueSizes[size]} font-bold text-white font-mono tracking-tight`} style={{ color: status !== 'normal' ? activeColor : undefined }}>
          {loading ? '---' : formatValue(displayValue, format, unit)}
        </span>
        {unit && <span className="text-xs text-zinc-500 mb-1">{unit}</span>}
      </div>

      {/* Delta / Trend */}
      {computedDelta !== undefined && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {computedDelta > 0 ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
          ) : computedDelta < 0 ? (
            <ArrowDownRight className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-zinc-500" />
          )}
          <span className={`text-xs font-medium ${computedDelta > 0 ? 'text-red-400' : computedDelta < 0 ? 'text-green-400' : 'text-zinc-500'}`}>
            {computedDelta > 0 ? '+' : ''}{computedDelta.toFixed(1)}%
          </span>
          {deltaLabel && <span className="text-[10px] text-zinc-500">{deltaLabel}</span>}
        </div>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3">
          <Sparkline data={sparklineData} color={activeColor} width={size === 'sm' ? 80 : size === 'lg' ? 140 : 110} height={size === 'sm' ? 24 : 32} threshold={threshold} />
        </div>
      )}

      {/* Target progress bar */}
      {target !== undefined && typeof value === 'number' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-1">
            <span>Progress</span>
            <span>{((value / target) * 100).toFixed(0)}% of target</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: activeColor }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((value / target) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Subtitle / Last Updated */}
      {(subtitle || lastUpdated) && (
        <div className="mt-2 flex items-center justify-between">
          {subtitle && <span className="text-[10px] text-zinc-500">{subtitle}</span>}
          {lastUpdated && <span className="text-[9px] text-zinc-600">{lastUpdated}</span>}
        </div>
      )}

      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ backgroundColor: activeColor, opacity: 0.6 }} />
    </motion.div>
  );
}

export default MetricCard;
