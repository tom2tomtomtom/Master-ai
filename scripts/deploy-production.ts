#!/usr/bin/env tsx
/**
 * Production Deployment Script
 * 
 * This script handles production deployment with comprehensive validation:
 * - Database connectivity validation
 * - Environment variable checks  
 * - Lesson data verification
 * - Health checks before and after deployment
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

interface DeploymentConfig {
  validateDatabase: boolean;
  runMigrations: boolean;
  verifyLessons: boolean;
  healthCheckTimeout: number;
  maxRetries: number;
}

class ProductionDeployer {
  private config: DeploymentConfig;
  private prisma: PrismaClient;
  
  constructor(config: Partial<DeploymentConfig> = {}) {
    this.config = {
      validateDatabase: true,
      runMigrations: true,
      verifyLessons: true,
      healthCheckTimeout: 30000,
      maxRetries: 3,
      ...config
    };
    
    this.prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    });
  }

  async deploy(dryRun: boolean = false): Promise<void> {
    console.log('🚀 Starting production deployment...');
    console.log(`📋 Mode: ${dryRun ? 'DRY RUN' : 'LIVE DEPLOYMENT'}`);
    
    try {
      // Pre-deployment validation
      await this.validateEnvironment();
      
      if (this.config.validateDatabase) {
        await this.validateDatabaseConnection();
      }
      
      if (this.config.verifyLessons) {
        await this.verifyLessonData();
      }
      
      if (!dryRun) {
        // Run database migrations
        if (this.config.runMigrations) {
          await this.runDatabaseMigrations();
        }
        
        // Deploy to Vercel
        await this.deployToVercel();
        
        // Post-deployment validation
        await this.validateDeployment();
      }
      
      console.log('✅ Production deployment completed successfully!');
      
    } catch (error) {
      console.error('❌ Production deployment failed:', error);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment variables...');
    
    const requiredVars = [
      'DATABASE_URL',
      'DIRECT_DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // Validate database URLs don't have newlines
    const databaseUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_DATABASE_URL;
    
    if (databaseUrl?.includes('\\n') || directUrl?.includes('\\n')) {
      throw new Error('Database URLs contain invalid newline characters');
    }
    
    console.log('✅ Environment variables validated');
  }

  private async validateDatabaseConnection(): Promise<void> {
    console.log('🔗 Validating database connection...');
    
    let attempts = 0;
    const maxAttempts = this.config.maxRetries;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`⏳ Connection attempt ${attempts}/${maxAttempts}...`);
        
        // Test basic connectivity
        await this.prisma.$queryRaw`SELECT 1 as test`;
        
        // Test table access
        const lessonsCount = await this.prisma.lesson.count();
        console.log(`📊 Database contains ${lessonsCount} lessons`);
        
        console.log('✅ Database connection validated');
        return;
        
      } catch (error) {
        console.error(`❌ Connection attempt ${attempts} failed:`, 
          error instanceof Error ? error.message : 'Unknown error');
        
        if (attempts < maxAttempts) {
          const waitTime = Math.min(2000 * attempts, 8000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw new Error('Failed to establish database connection after all retries');
  }

  private async verifyLessonData(): Promise<void> {
    console.log('📚 Verifying lesson data...');
    
    try {
      const lessons = await this.prisma.lesson.findMany({
        select: {
          id: true,
          lessonNumber: true,
          title: true,
          isPublished: true
        },
        take: 10
      });
      
      console.log(`📊 Found ${lessons.length} lessons in database`);
      
      if (lessons.length === 0) {
        console.warn('⚠️  Warning: No lessons found in database. Users will see fallback content.');
      } else {
        console.log('✅ Lesson data verified');
        
        // Log sample lessons
        console.log('📋 Sample lessons:');
        lessons.slice(0, 3).forEach(lesson => {
          console.log(`   - Lesson ${lesson.lessonNumber}: ${lesson.title}`);
        });
      }
      
    } catch (error) {
      console.warn('⚠️  Warning: Could not verify lesson data:', 
        error instanceof Error ? error.message : 'Unknown error');
      console.log('   Users will see fallback content if database is unavailable.');
    }
  }

  private async runDatabaseMigrations(): Promise<void> {
    console.log('🗄️  Running database migrations...');
    
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw new Error('Database migration failed');
    }
  }

  private async deployToVercel(): Promise<void> {
    console.log('🚀 Deploying to Vercel...');
    
    try {
      // Deploy to production
      const output = execSync('vercel --prod --yes', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      console.log('✅ Vercel deployment completed');
      
      // Extract deployment URL from output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        console.log(`🌐 Deployment URL: ${urlMatch[0]}`);
      }
      
    } catch (error) {
      console.error('❌ Vercel deployment failed:', error);
      throw new Error('Vercel deployment failed');
    }
  }

  private async validateDeployment(): Promise<void> {
    console.log('🔍 Validating deployment...');
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.master-ai-learn.com';
    const healthEndpoints = [
      '/api/health/database',
      '/api/lessons',
    ];
    
    console.log(`🌐 Testing endpoints at ${baseUrl}...`);
    
    for (const endpoint of healthEndpoints) {
      try {
        console.log(`⏳ Testing ${endpoint}...`);
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Master-AI-Deployment-Validator/1.0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint} - Status: ${response.status}`);
          
          // Special handling for lessons endpoint
          if (endpoint === '/api/lessons' && data.lessons) {
            console.log(`   📚 Lessons available: ${data.lessons.length}`);
          }
          
          // Special handling for database health
          if (endpoint === '/api/health/database' && data.status) {
            console.log(`   🗄️  Database status: ${data.status}`);
          }
          
        } else {
          console.warn(`⚠️  ${endpoint} - Status: ${response.status}`);
        }
        
      } catch (error) {
        console.warn(`⚠️  ${endpoint} - Error:`, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    console.log('✅ Deployment validation completed');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipDb = args.includes('--skip-database');
  const skipLessons = args.includes('--skip-lessons');
  
  const deployer = new ProductionDeployer({
    validateDatabase: !skipDb,
    verifyLessons: !skipLessons,
  });
  
  await deployer.deploy(dryRun);
}

// Handle CLI execution
if (require.main === module) {
  main().catch(console.error);
}

export { ProductionDeployer };