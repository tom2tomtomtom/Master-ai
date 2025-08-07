import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    icon: 'text-orange-600',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-600',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className
}: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {trend && (
                <span className={cn(
                  'ml-2 text-sm font-medium',
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                )}>
                  {trend.direction === 'up' ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn('p-3 rounded-lg', colors.bg)}>
              <Icon className={cn('h-6 w-6', colors.icon)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}