'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const skeletonCardVariants = cva(
  "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded-md",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
        glass: "bg-gradient-to-r from-white/20 via-white/10 to-white/20 backdrop-blur-glass border border-white/20",
        shimmer: "bg-gradient-to-r from-gray-200 via-white to-gray-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface SkeletonCardProps extends VariantProps<typeof skeletonCardVariants> {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showButton?: boolean;
  height?: string;
}

export function SkeletonCard({
  variant,
  className,
  lines = 3,
  showAvatar = false,
  showButton = false,
  height = "h-auto",
}: SkeletonCardProps) {
  return (
    <div className={cn(
      "p-6 space-y-4 rounded-lg border bg-card",
      height,
      className
    )}>
      {/* Header with optional avatar */}
      <div className="flex items-center space-x-4">
        {showAvatar && (
          <div className={cn(
            skeletonCardVariants({ variant }),
            "h-12 w-12 rounded-full"
          )} />
        )}
        <div className="space-y-2 flex-1">
          <div className={cn(
            skeletonCardVariants({ variant }),
            "h-4 w-3/4"
          )} />
          <div className={cn(
            skeletonCardVariants({ variant }),
            "h-3 w-1/2"
          )} />
        </div>
      </div>

      {/* Content lines */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              skeletonCardVariants({ variant }),
              "h-3",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>

      {/* Optional button */}
      {showButton && (
        <div className={cn(
          skeletonCardVariants({ variant }),
          "h-9 w-24 rounded-md"
        )} />
      )}
    </div>
  );
}

// Individual skeleton elements for more granular control
export function Skeleton({ 
  className, 
  variant = "default",
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonCardVariants>) {
  return (
    <div
      className={cn(skeletonCardVariants({ variant }), className)}
      {...props}
    />
  );
}

// Specialized skeleton components
export function SkeletonText({ 
  lines = 1, 
  className,
  variant = "default" 
}: { 
  lines?: number; 
  className?: string;
  variant?: VariantProps<typeof skeletonCardVariants>['variant'];
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            skeletonCardVariants({ variant }),
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonButton({ 
  className,
  variant = "default",
  size = "default"
}: { 
  className?: string;
  variant?: VariantProps<typeof skeletonCardVariants>['variant'];
  size?: 'sm' | 'default' | 'lg';
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    default: "h-10 w-24", 
    lg: "h-11 w-28"
  };
  
  return (
    <div
      className={cn(
        skeletonCardVariants({ variant }),
        sizeClasses[size],
        "rounded-md",
        className
      )}
    />
  );
}

export function SkeletonAvatar({ 
  className,
  variant = "default",
  size = "default"
}: { 
  className?: string;
  variant?: VariantProps<typeof skeletonCardVariants>['variant'];
  size?: 'sm' | 'default' | 'lg';
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12"
  };
  
  return (
    <div
      className={cn(
        skeletonCardVariants({ variant }),
        sizeClasses[size],
        "rounded-full",
        className
      )}
    />
  );
}