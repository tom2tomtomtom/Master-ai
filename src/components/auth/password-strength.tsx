'use client';

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;
    
    return {
      score,
      checks,
      percentage: (score / 5) * 100,
      label: score <= 1 ? 'Weak' : score <= 3 ? 'Medium' : score <= 4 ? 'Strong' : 'Very Strong',
      color: score <= 1 ? 'bg-red-500' : score <= 3 ? 'bg-yellow-500' : score <= 4 ? 'bg-blue-500' : 'bg-green-500'
    };
  };

  if (!password) return null;

  const strength = getPasswordStrength(password);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength</span>
        <span className={cn(
          "font-medium",
          strength.score <= 1 ? 'text-red-600' :
          strength.score <= 3 ? 'text-yellow-600' :
          strength.score <= 4 ? 'text-blue-600' : 'text-green-600'
        )}>
          {strength.label}
        </span>
      </div>
      <Progress 
        value={strength.percentage} 
        className="h-2"
      />
      <div className="text-xs text-muted-foreground space-y-1">
        <div className={cn("flex items-center gap-2", strength.checks.length && "text-green-600")}>
          <span className={cn("w-2 h-2 rounded-full", strength.checks.length ? "bg-green-500" : "bg-gray-300")} />
          At least 8 characters
        </div>
        <div className={cn("flex items-center gap-2", strength.checks.lowercase && "text-green-600")}>
          <span className={cn("w-2 h-2 rounded-full", strength.checks.lowercase ? "bg-green-500" : "bg-gray-300")} />
          One lowercase letter
        </div>
        <div className={cn("flex items-center gap-2", strength.checks.uppercase && "text-green-600")}>
          <span className={cn("w-2 h-2 rounded-full", strength.checks.uppercase ? "bg-green-500" : "bg-gray-300")} />
          One uppercase letter
        </div>
        <div className={cn("flex items-center gap-2", strength.checks.number && "text-green-600")}>
          <span className={cn("w-2 h-2 rounded-full", strength.checks.number ? "bg-green-500" : "bg-gray-300")} />
          One number
        </div>
        <div className={cn("flex items-center gap-2", strength.checks.special && "text-green-600")}>
          <span className={cn("w-2 h-2 rounded-full", strength.checks.special ? "bg-green-500" : "bg-gray-300")} />
          One special character
        </div>
      </div>
    </div>
  );
}