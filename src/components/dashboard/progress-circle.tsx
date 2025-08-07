'use client';

interface ProgressCircleProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'orange';
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16', 
  lg: 'w-24 h-24'
};

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600'
};

export function ProgressCircle({ 
  value, 
  size = 'md', 
  color = 'blue', 
  showValue = true,
  className = ''
}: ProgressCircleProps) {
  const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const svgSize = size === 'sm' ? 48 : size === 'md' ? 64 : 96;
  const center = svgSize / 2;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <svg
        className="transform -rotate-90"
        width={svgSize}
        height={svgSize}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClasses[color]} transition-all duration-300 ease-in-out`}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-semibold ${colorClasses[color]}`}>
            {Math.round(value)}%
          </span>
        </div>
      )}
    </div>
  );
}