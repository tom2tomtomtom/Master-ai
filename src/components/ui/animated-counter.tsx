'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
  onComplete?: () => void;
}

export function AnimatedCounter({
  end,
  start = 0,
  duration = 2000,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = ',',
  onComplete,
}: AnimatedCounterProps) {
  const [current, setCurrent] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    
    const startTime = Date.now();
    const difference = end - start;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      const currentValue = start + (difference * easedProgress);
      setCurrent(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, [end, start, duration, onComplete]);

  const formatNumber = (num: number) => {
    const rounded = num.toFixed(decimals);
    const parts = rounded.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join('.');
  };

  return (
    <span
      className={cn(
        "tabular-nums font-bold transition-all duration-300",
        isAnimating && "animate-pulse",
        className
      )}
    >
      {prefix}{formatNumber(current)}{suffix}
    </span>
  );
}

// Specialized counter components
export function ProgressCounter({
  value,
  total,
  className,
  showPercentage = false,
}: {
  value: number;
  total: number;
  className?: string;
  showPercentage?: boolean;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AnimatedCounter end={value} className="text-ai-blue-600 font-bold" />
      <span className="text-gray-500">/</span>
      <span className="text-gray-700 font-medium">{total}</span>
      {showPercentage && (
        <span className="text-sm text-gray-500">
          (<AnimatedCounter end={percentage} suffix="%" className="text-ai-blue-600" />)
        </span>
      )}
    </div>
  );
}

export function MetricCounter({
  value,
  label,
  trend,
  className,
}: {
  value: number;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <div className="flex items-center justify-center gap-1">
        <AnimatedCounter 
          end={value} 
          className="text-2xl font-bold text-gray-900" 
        />
        {trend && (
          <span
            className={cn(
              "text-sm font-medium",
              trend.direction === 'up' ? "text-success-600" : "text-red-500"
            )}
          >
            {trend.direction === 'up' ? '+' : '-'}
            <AnimatedCounter 
              end={Math.abs(trend.value)}
              className="font-medium"
            />
          </span>
        )}
      </div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
    </div>
  );
}

export function TimeCounter({
  seconds,
  className,
}: {
  seconds: number;
  className?: string;
}) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <AnimatedCounter end={hours} className="font-bold" />
        <span className="text-sm text-gray-500">h</span>
        <AnimatedCounter end={minutes} className="font-bold" />
        <span className="text-sm text-gray-500">m</span>
      </div>
    );
  }

  if (minutes > 0) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <AnimatedCounter end={minutes} className="font-bold" />
        <span className="text-sm text-gray-500">m</span>
        <AnimatedCounter end={remainingSeconds} className="font-bold" />
        <span className="text-sm text-gray-500">s</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <AnimatedCounter end={remainingSeconds} className="font-bold" />
      <span className="text-sm text-gray-500">s</span>
    </div>
  );
}