'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const glassCardVariants = cva(
  "relative overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        default: [
          "bg-white/10 backdrop-blur-glass border border-white/20",
          "shadow-glass hover:shadow-glass-sm",
          "hover:bg-white/15"
        ],
        strong: [
          "bg-white/20 backdrop-blur-glass border border-white/30",
          "shadow-glass-sm hover:shadow-glass",
          "hover:bg-white/25"
        ],
        subtle: [
          "bg-white/5 backdrop-blur-glass border border-white/10",
          "shadow-glass-sm hover:shadow-glass",
          "hover:bg-white/10"
        ],
        colored: [
          "bg-gradient-to-br from-ai-blue-500/10 to-ai-purple-500/10",
          "backdrop-blur-glass border border-ai-blue-500/20",
          "shadow-glass hover:shadow-ai-glow",
          "hover:from-ai-blue-500/15 hover:to-ai-purple-500/15"
        ],
        interactive: [
          "bg-white/10 backdrop-blur-glass border border-white/20",
          "shadow-glass hover:shadow-glass-sm hover:scale-[1.02]",
          "hover:bg-white/15 cursor-pointer",
          "active:scale-[0.98] active:shadow-glass-sm"
        ]
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm", 
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        full: "rounded-full"
      }
    },
    defaultVariants: {
      variant: "default",
      rounded: "lg",
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  children: React.ReactNode;
  glow?: boolean;
  animated?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, rounded, children, glow = false, animated = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, rounded }),
          glow && "shadow-ai-glow hover:shadow-ai-glow-lg",
          animated && "animate-scale-in",
          className
        )}
        {...props}
      >
        {children}
        
        {/* Optional glow effect overlay */}
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-r from-ai-blue-500/5 to-ai-purple-500/5 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300" />
        )}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-white/90",
      className
    )}
    {...props}
  />
));
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/70", className)}
    {...props}
  />
));
GlassCardDescription.displayName = "GlassCardDescription";

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
GlassCardFooter.displayName = "GlassCardFooter";

export { 
  GlassCard, 
  GlassCardHeader, 
  GlassCardFooter, 
  GlassCardTitle, 
  GlassCardDescription, 
  GlassCardContent,
  glassCardVariants
};

// Specialized glass components
export function GlassPanel({ 
  children, 
  className, 
  ...props 
}: GlassCardProps) {
  return (
    <GlassCard 
      variant="strong"
      className={cn("p-6", className)}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function FloatingGlassCard({
  children,
  className,
  ...props
}: GlassCardProps) {
  return (
    <GlassCard
      variant="default"
      className={cn(
        "absolute z-10 animate-float",
        className
      )}
      glow
      {...props}
    >
      {children}
    </GlassCard>
  );
}