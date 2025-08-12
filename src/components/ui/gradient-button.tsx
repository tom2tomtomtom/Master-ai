'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const gradientButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        gradient: [
          "bg-gradient-ai text-white shadow-lg",
          "hover:shadow-ai-glow hover:scale-105",
          "active:scale-95",
          "before:absolute before:inset-0 before:bg-gradient-mesh before:opacity-0 before:transition-opacity before:duration-300",
          "hover:before:opacity-20"
        ],
        "gradient-purple": [
          "bg-gradient-to-r from-ai-purple-500 to-ai-purple-700 text-white shadow-lg",
          "hover:from-ai-purple-600 hover:to-ai-purple-800 hover:shadow-ai-glow hover:scale-105",
          "active:scale-95"
        ],
        "gradient-blue": [
          "bg-gradient-to-r from-ai-blue-500 to-ai-blue-700 text-white shadow-lg", 
          "hover:from-ai-blue-600 hover:to-ai-blue-800 hover:shadow-ai-glow hover:scale-105",
          "active:scale-95"
        ],
        glass: [
          "bg-white/10 backdrop-blur-glass border border-white/20 text-white shadow-glass",
          "hover:bg-white/20 hover:shadow-glass-sm hover:scale-105",
          "active:scale-95"
        ],
        shimmer: [
          "bg-gradient-to-r from-ai-blue-500 via-ai-purple-500 to-ai-blue-500 text-white shadow-lg",
          "bg-[length:200%_100%] animate-shimmer",
          "hover:shadow-ai-glow-lg hover:scale-105",
          "active:scale-95"
        ],
        glow: [
          "bg-ai-blue-500 text-white shadow-ai-glow",
          "hover:bg-ai-blue-600 hover:shadow-ai-glow-lg hover:scale-105",
          "animate-pulse-glow",
          "active:scale-95"
        ],
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-md px-12 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "gradient",
      size: "default",
    },
  }
);

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        
        <div className={cn(
          "flex items-center gap-2",
          loading && "opacity-0"
        )}>
          {icon && iconPosition === 'left' && (
            <span className="inline-flex items-center">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="inline-flex items-center">{icon}</span>
          )}
        </div>
      </Comp>
    );
  }
);
GradientButton.displayName = "GradientButton";

export { GradientButton, gradientButtonVariants };

// Additional helper components
export function FloatingActionButton({
  children,
  className,
  ...props
}: GradientButtonProps) {
  return (
    <GradientButton
      variant="glow"
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 rounded-full shadow-2xl animate-float",
        "hover:shadow-ai-glow-lg",
        className
      )}
      {...props}
    >
      {children}
    </GradientButton>
  );
}

export function PulseButton({
  children,
  className,
  ...props
}: GradientButtonProps) {
  return (
    <GradientButton
      variant="shimmer"
      className={cn("animate-pulse", className)}
      {...props}
    >
      {children}
    </GradientButton>
  );
}