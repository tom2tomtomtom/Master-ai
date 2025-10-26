import { z } from 'zod';

// Environment variable schema
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server configuration
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  HOST: z.string().default('localhost'),
  
  // Database
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  DATABASE_POOL_MIN: z.string().regex(/^\d+$/).transform(Number).default('2'),
  DATABASE_POOL_MAX: z.string().regex(/^\d+$/).transform(Number).default('10'),
  
  // Redis
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')).optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  
  // Session
  SESSION_SECRET: z.string().min(32),
  SESSION_MAX_AGE: z.string().regex(/^\d+$/).transform(Number).default('86400000'), // 24 hours
  
  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default('100'),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).default('587'),
  SMTP_SECURE: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // External APIs
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
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
});

// Type inference
export type Env = z.infer<typeof envSchema>;

// Validate environment variables
export const validateEnv = () => {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, data: env };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.message === 'Required')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => err.message !== 'Required')
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

// Export validated environment
export const env = (() => {
  const validation = validateEnv();
  if (!validation.success) {
    console.error('❌ Environment validation failed:');
    if (validation.error.missing.length > 0) {
      console.error('Missing variables:', validation.error.missing.join(', '));
    }
    if (validation.error.invalid.length > 0) {
      console.error('Invalid variables:', validation.error.invalid.join(', '));
    }
    process.exit(1);
  }
  return validation.data;
})();
