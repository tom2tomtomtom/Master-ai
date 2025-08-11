import { z } from 'zod';

// Environment variable schema for Master-AI SaaS
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server configuration
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  HOST: z.string().default('localhost'),
  
  // Content root directory
  CONTENT_ROOT_DIR: z.string().default(process.cwd()),
  
  // Database - Supabase
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  DIRECT_DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://'))
    .optional()
    .transform(val => val || process.env.DATABASE_URL),
  DATABASE_POOL_MIN: z.string().regex(/^\d+$/).transform(Number).default('2'),
  DATABASE_POOL_MAX: z.string().regex(/^\d+$/).transform(Number).default('10'),
  
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // NextAuth.js
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  
  // Redis
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')).optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  
  // Authentication
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: z.string().min(32).optional(),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  
  // Session
  SESSION_SECRET: z.string().min(32).optional(),
  SESSION_MAX_AGE: z.string().regex(/^\d+$/).transform(Number).default('86400000'), // 24 hours
  
  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default('100'),
  
  // Stripe
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).default('587'),
  SMTP_SECURE: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // External APIs
  OPENAI_API_KEY: z.string().optional(),
  
  // Storage
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default('10485760'), // 10MB
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('./logs/app.log'),
  
  // Feature flags
  ENABLE_RATE_LIMITING: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  ENABLE_CSRF_PROTECTION: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  ENABLE_CACHE: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  ENABLE_METRICS: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  METRICS_PORT: z.string().regex(/^\d+$/).transform(Number).default('9090'),
  
  // Build-time flags
  SKIP_ENV_VALIDATION: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  ESLINT_NO_DEV_ERRORS: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
});

// Type inference
export type Env = z.infer<typeof envSchema>;

// Validate environment variables
export const validateEnv = () => {
  // Skip validation in build environments if flag is set
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return { success: true, data: process.env as any };
  }

  try {
    const env = envSchema.parse(process.env);
    return { success: true, data: env };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => !(err.code === 'invalid_type' && err.received === 'undefined'))
        .map(err => `${err.path.join('.')}: ${err.message}`);
      
      return {
        success: false,
        error: {
          missing: missingVars,
          invalid: invalidVars,
          details: error.errors,
        },
      };
    }
    throw error;
  }
};

// Helper to get typed environment variable
export const getEnv = <K extends keyof Env>(key: K): Env[K] => {
  const validation = validateEnv();
  if (!validation.success) {
    throw new Error(`Environment validation failed: ${JSON.stringify(validation.error)}`);
  }
  return validation.data[key];
};

// Export validated environment (with graceful degradation)
export const env = (() => {
  const validation = validateEnv();
  if (!validation.success) {
    console.error('❌ Environment validation failed:');
    if (validation.error.missing.length > 0) {
      console.error('Missing required variables:', validation.error.missing.join(', '));
    }
    if (validation.error.invalid.length > 0) {
      console.error('Invalid variables:', validation.error.invalid.join(', '));
    }
    
    // In development, warn but continue
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Continuing with invalid environment in development mode');
      return process.env as any;
    }
    
    // In production, exit
    process.exit(1);
  }
  return validation.data;
})();