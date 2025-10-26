'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const progressRingVariants = cva(
  "relative inline-flex items-center justify-center transition-all duration-300",
  {
    variants: {
      size: {
        sm: "h-12 w-12",
        md: "h-16 w-16",
        lg: "h-24 w-24",
        xl: "h-32 w-32",
      },
      variant: {
        default: "",
        glow: "animate-pulse-glow",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

interface ProgressRingProps extends VariantProps<typeof progressRingVariants> {
  value: number; // 0-100
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  animated?: boolean;
  color?: 'blue' | 'purple' | 'green' | 'orange';
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  strokeWidth = 4,
  size,
  variant,
  className,
  showValue = true,
  animated = true,
  color = 'blue',
  children,
}: ProgressRingProps) {
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  
  // Calculate dimensions based on size
  const dimensions = {
    sm: { size: 48, center: 24, radius: 20 },
    md: { size: 64, center: 32, radius: 28 },
    lg: { size: 96, center: 48, radius: 44 },
    xl: { size: 128, center: 64, radius: 60 },
  };
  
  const { size: svgSize, center, radius } = dimensions[size || 'md'];
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  const colorClasses = {
    blue: 'stroke-ai-blue-500',
    purple: 'stroke-ai-purple-500', 
    green: 'stroke-success-500',
    orange: 'stroke-warning-500',
  };

  return (
    <div className={cn(progressRingVariants({ size, variant, className }))}>
      <svg
        width={svgSize}
        height={svgSize}
        className="transform -rotate-90"
        viewBox={`0 0 ${svgSize} ${svgSize}`}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            colorClasses[color],
            animated && "transition-all duration-1000 ease-out"
          )}
          style={{
            filter: variant === 'glow' ? `drop-shadow(0 0 8px ${color === 'blue' ? '#0066ff' : color === 'purple' ? '#6b46c1' : color === 'green' ? '#22c55e' : '#eab308'})` : undefined,
          }}
        />
      </svg>
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <div className="text-center">
            <div className={cn(
              "font-bold text-gray-900 dark:text-white",
              size === 'sm' && "text-xs",
              size === 'md' && "text-sm",
              size === 'lg' && "text-lg",
              size === 'xl' && "text-2xl"
            )}>
              {Math.round(normalizedValue)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}