'use client';

import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
  animated?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-ai-blue-50',
    text: 'text-ai-blue-700',
    icon: 'text-ai-blue-600',
    gradient: 'from-ai-blue-500 to-ai-blue-600',
    glow: 'shadow-ai-glow',
  },
  green: {
    bg: 'bg-success-50',
    text: 'text-success-700',
    icon: 'text-success-600',
    gradient: 'from-success-500 to-success-600',
    glow: 'shadow-green-400/30',
  },
  purple: {
    bg: 'bg-ai-purple-50',
    text: 'text-ai-purple-700',
    icon: 'text-ai-purple-600',
    gradient: 'from-ai-purple-500 to-ai-purple-600',
    glow: 'shadow-ai-purple-400/30',
  },
  orange: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    icon: 'text-warning-600',
    gradient: 'from-warning-500 to-warning-600',
    glow: 'shadow-warning-400/30',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
    glow: 'shadow-red-400/30',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className,
  variant = 'default',
  animated = true
}: StatsCardProps) {
  const colors = colorClasses[color];
  
  const renderValue = () => {
    if (typeof value === 'number' && animated) {
      return <AnimatedCounter end={value} className={cn(
        "text-2xl font-bold",
        variant === 'glass' || variant === 'gradient' ? "text-white" : "text-gray-900"
      )} />;
    }
    return <span className={cn(
      "text-2xl font-bold",
      variant === 'glass' || variant === 'gradient' ? "text-white" : "text-gray-900"
    )}>{value}</span>;
  };

  const cardContent = (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={cn(
            "text-sm font-medium mb-1",
            variant === 'glass' || variant === 'gradient' ? "text-white/90" : "text-gray-600"
          )}>
            {title}
          </p>
          <div className="flex items-baseline">
            {renderValue()}
            {trend && (
              <div className={cn(
                'ml-2 flex items-center gap-1 text-sm font-medium',
                trend.direction === 'up' ? 'text-success-600' : 'text-red-600'
              )}>
                {trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <AnimatedCounter end={Math.abs(trend.value)} suffix="%" />
              </div>
            )}
          </div>
          {subtitle && (
            <p className={cn(
              "text-sm mt-1",
              variant === 'glass' || variant === 'gradient' ? "text-white/80" : "text-gray-500"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        
        {Icon && (
          <div className={cn(
            'p-3 rounded-lg transition-all duration-300',
            variant === 'glass' 
              ? 'bg-white/10 backdrop-blur-sm border border-white/20' 
              : variant === 'gradient'
              ? `bg-gradient-to-r ${colors.gradient} shadow-lg ${colors.glow}`
              : colors.bg,
            'group-hover:scale-110'
          )}>
            <Icon className={cn(
              'h-6 w-6 transition-colors duration-300',
              variant === 'glass' ? 'text-white' : variant === 'gradient' ? 'text-white' : colors.icon
            )} />
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'glass') {
    return (
      <GlassCard 
        variant="interactive"
        className={cn('group', className)}
      >
        {cardContent}
      </GlassCard>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={cn(
        'rounded-lg bg-gradient-to-br group cursor-pointer transition-all duration-300',
        colors.gradient,
        'hover:scale-105 hover:shadow-xl',
        colors.glow,
        className
      )}>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      'border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer',
      'hover:scale-105 animate-scale-in',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline">
              {renderValue()}
              {trend && (
                <div className={cn(
                  'ml-2 flex items-center gap-1 text-sm font-medium',
                  trend.direction === 'up' ? 'text-success-600' : 'text-red-600'
                )}>
                  {trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <AnimatedCounter end={Math.abs(trend.value)} suffix="%" />
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              'p-3 rounded-lg transition-all duration-300',
              colors.bg,
              'group-hover:scale-110'
            )}>
              <Icon className={cn('h-6 w-6 transition-colors duration-300', colors.icon)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}