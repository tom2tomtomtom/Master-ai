/**
 * Environment Variable Validation
 * Ensures all required environment variables are present at startup
 */

interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  
  // Authentication
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL?: string;
  
  // OAuth Providers (optional)
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  
  // Stripe Payment Processing
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  
  // Monitoring & Analytics (optional)
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  SENTRY_DSN?: string;
  
  // Email Service (optional for now)
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
}

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
] as const;

const _OPTIONAL_ENV_VARS = [
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'SENTRY_DSN',
  'RESEND_API_KEY',
  'SENDGRID_API_KEY',
] as const;

/**
 * Validates that all required environment variables are present
 * @throws Error if required variables are missing
 */
export function validateRequiredEnvVars(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check for security weaknesses
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    warnings.push('NEXTAUTH_SECRET should be at least 32 characters long for security');
  }

  // Check OAuth configuration completeness
  const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID;
  const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  if (hasGoogleId !== hasGoogleSecret) {
    warnings.push('Google OAuth: Both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together');
  }

  const hasGitHubId = !!process.env.GITHUB_CLIENT_ID;
  const hasGitHubSecret = !!process.env.GITHUB_CLIENT_SECRET;
  if (hasGitHubId !== hasGitHubSecret) {
    warnings.push('GitHub OAuth: Both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set together');
  }

  // Report results
  if (missing.length > 0) {
    const errorMessage = [
      '🚨 Environment Configuration Error',
      '',
      `Missing required environment variables:`,
      ...missing.map(var_ => `  - ${var_}`),
      '',
      'Please ensure all required environment variables are set in your .env file.',
      'See the deployment guide for complete setup instructions.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Environment Configuration Warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('');
  }

  // Success message
  console.log('✅ Environment variables validated successfully');
  
  // Log optional features status
  const enabledFeatures: string[] = [];
  if (hasGoogleId && hasGoogleSecret) enabledFeatures.push('Google OAuth');
  if (hasGitHubId && hasGitHubSecret) enabledFeatures.push('GitHub OAuth');
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) enabledFeatures.push('PostHog Analytics');
  if (process.env.SENTRY_DSN) enabledFeatures.push('Sentry Error Tracking');
  if (process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY) enabledFeatures.push('Email Service');
  
  if (enabledFeatures.length > 0) {
    console.log(`🎯 Optional features enabled: ${enabledFeatures.join(', ')}`);
  }
}

/**
 * Gets validated environment configuration
 * @returns Typed environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  validateRequiredEnvVars();
  
  return {
    // Required
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    
    // Optional
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  };
}

/**
 * Validates environment on module import (for server-side)
 * Only runs in Node.js environment, not in browser
 */
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    validateRequiredEnvVars();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Environment validation failed');
    process.exit(1);
  }
}