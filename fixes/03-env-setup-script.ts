#!/usr/bin/env tsx
// Environment setup and validation script
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import * as crypto from 'crypto';

// Environment variable schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),

  // Authentication
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),

  // Email
  RESEND_API_KEY: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Content
  CONTENT_ROOT_DIR: z.string().default('../'),

  // Feature Flags
  ENABLE_REDIS_CACHE: z.string().transform(val => val === 'true').default('false'),
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_MONITORING: z.string().transform(val => val === 'true').default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

type EnvConfig = z.infer<typeof envSchema>;

class EnvironmentSetup {
  private rootDir: string;
  
  constructor() {
    this.rootDir = process.cwd();
  }

  /**
   * Generate a secure random secret
   */
  generateSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64').replace(/[+/=]/g, '');
  }

  /**
   * Load and validate environment variables
   */
  loadEnv(): Partial<EnvConfig> {
    const envPath = path.join(this.rootDir, '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('No .env file found. Creating from .env.example...');
      this.createEnvFromExample();
    }

    // Load environment variables
    require('dotenv').config({ path: envPath });
    
    return process.env as any;
  }

  /**
   * Create .env from .env.example
   */
  createEnvFromExample(): void {
    const examplePath = path.join(this.rootDir, '.env.example');
    const envPath = path.join(this.rootDir, '.env');
    
    if (!fs.existsSync(examplePath)) {
      throw new Error('.env.example not found!');
    }

    let content = fs.readFileSync(examplePath, 'utf8');
    
    // Generate secrets
    content = content.replace(
      'NEXTAUTH_SECRET=your-secret-key-here',
      `NEXTAUTH_SECRET=${this.generateSecret(32)}`
    );

    fs.writeFileSync(envPath, content);
    console.log('Created .env file with generated secrets');
  }

  /**
   * Validate environment variables
   */
  validateEnv(env: Partial<EnvConfig>): EnvConfig {
    try {
      return envSchema.parse(env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Environment validation failed:');
        error.errors.forEach(err => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
      }
      throw error;
    }
  }

  /**
   * Check for deprecated environment variables
   */
  checkDeprecated(env: Record<string, any>): void {
    const deprecated = [
      { old: 'POSTGRES_URL', new: 'DATABASE_URL' },
      { old: 'NEXTAUTH_URL_INTERNAL', new: 'NEXTAUTH_URL' },
    ];

    deprecated.forEach(({ old, new: newVar }) => {
      if (env[old]) {
        console.warn(`⚠️  Warning: ${old} is deprecated. Use ${newVar} instead.`);
      }
    });
  }

  /**
   * Main setup function
   */
  async setup(): Promise<void> {
    console.log('🔧 Setting up environment...\n');

    // Load environment
    const env = this.loadEnv();
    
    // Check for deprecated variables
    this.checkDeprecated(env);
    
    // Validate environment
    const config = this.validateEnv(env);
    
    console.log('✅ Environment validated successfully!\n');
    
    // Display configuration (hide sensitive values)
    console.log('📋 Configuration:');
    Object.entries(config).forEach(([key, value]) => {
      const isSensitive = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN');
      const displayValue = isSensitive ? '***' : value;
      console.log(`  ${key}: ${displayValue}`);
    });

    // Create env.d.ts for TypeScript
    this.createEnvTypes(config);
  }

  /**
   * Create TypeScript definitions for environment variables
   */
  createEnvTypes(config: EnvConfig): void {
    const envDtsPath = path.join(this.rootDir, 'env.d.ts');
    
    const content = `// Auto-generated environment type definitions
// Do not edit manually

declare namespace NodeJS {
  interface ProcessEnv {
${Object.keys(config).map(key => `    ${key}: string;`).join('\n')}
  }
}
`;

    fs.writeFileSync(envDtsPath, content);
    console.log('\n✅ Created env.d.ts for TypeScript support');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new EnvironmentSetup();
  setup.setup().catch(console.error);
}

export { EnvironmentSetup, envSchema };
