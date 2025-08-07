#!/usr/bin/env tsx

/**
 * Production Setup Script
 * 
 * This script handles the initial setup and seeding of the production database.
 * It should be run after the initial database migration in production.
 * 
 * Usage:
 * - npm run production-setup
 * - tsx scripts/production-setup.ts
 * - tsx scripts/production-setup.ts --force (to override safety checks)
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

// Configuration
const FORCE_FLAG = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

interface SetupStep {
  name: string;
  description: string;
  execute: () => Promise<void>;
  required: boolean;
}

async function main() {
  console.log('🚀 Starting Master AI SaaS Production Setup');
  console.log('==========================================');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }

  // Safety checks
  await performSafetyChecks();

  // Define setup steps
  const setupSteps: SetupStep[] = [
    {
      name: 'database-migration',
      description: 'Run database migrations',
      execute: runDatabaseMigrations,
      required: true,
    },
    {
      name: 'seed-achievements',
      description: 'Seed achievement system',
      execute: seedAchievements,
      required: true,
    },
    {
      name: 'setup-stripe-products',
      description: 'Setup Stripe products and prices',
      execute: setupStripeProducts,
      required: true,
    },
    {
      name: 'import-content',
      description: 'Import lesson content',
      execute: importContent,
      required: true,
    },
    {
      name: 'create-admin-user',
      description: 'Create admin user account',
      execute: createAdminUser,
      required: false,
    },
    {
      name: 'setup-monitoring',
      description: 'Configure monitoring and health checks',
      execute: setupMonitoring,
      required: false,
    },
  ];

  // Execute setup steps
  let completedSteps = 0;
  
  for (const step of setupSteps) {
    try {
      console.log(`\n📋 ${step.name}: ${step.description}`);
      
      if (DRY_RUN) {
        console.log(`   [DRY RUN] Would execute: ${step.name}`);
        continue;
      }

      await step.execute();
      completedSteps++;
      console.log(`   ✅ Completed: ${step.name}`);
      
    } catch (error) {
      console.error(`   ❌ Failed: ${step.name}`);
      console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (step.required) {
        console.error('\n💥 Required step failed. Aborting setup.');
        process.exit(1);
      } else {
        console.warn('   ⚠️  Optional step failed, continuing...');
      }
    }
  }

  console.log('\n🎉 Production setup completed successfully!');
  console.log(`📊 Completed ${completedSteps}/${setupSteps.length} steps`);
  console.log('\nNext steps:');
  console.log('1. Verify your application is accessible');
  console.log('2. Test critical user flows (signup, payment, lesson access)');
  console.log('3. Configure monitoring alerts');
  console.log('4. Set up backup procedures');

  await prisma.$disconnect();
}

async function performSafetyChecks() {
  console.log('\n🔒 Performing safety checks...');

  // Check environment
  const nodeEnv = process.env.NODE_ENV;
  const customEnv = process.env.APP_ENV; // Allow custom staging environment
  if (nodeEnv !== 'production' && customEnv !== 'staging' && !FORCE_FLAG) {
    throw new Error('This script should only run in production/staging environment. Use --force to override.');
  }

  // Check required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Test database connection
  try {
    await prisma.$connect();
    console.log('   ✅ Database connection successful');
  } catch (error) {
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check if this is a fresh setup or existing database
  try {
    const userCount = await prisma.user.count();
    const lessonCount = await prisma.lesson.count();
    
    if (userCount > 0 || lessonCount > 0) {
      if (!FORCE_FLAG) {
        console.log(`   ⚠️  Database appears to have existing data (${userCount} users, ${lessonCount} lessons)`);
        console.log('   Use --force flag to proceed with existing data');
        console.log('   Or use --dry-run to see what would be executed');
        throw new Error('Database not empty. Use --force to proceed.');
      } else {
        console.log(`   ⚠️  Proceeding with existing data (${userCount} users, ${lessonCount} lessons)`);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Database not empty')) {
      throw error;
    }
    // If we can't check the database, that might be because tables don't exist yet
    console.log('   ℹ️  Database appears to be uninitialized (this is normal for first setup)');
  }

  console.log('   ✅ Safety checks passed');
}

async function runDatabaseMigrations() {
  try {
    console.log('   🔄 Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('   🔄 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
  } catch (error) {
    throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function seedAchievements() {
  try {
    console.log('   🏆 Seeding achievements...');
    
    // Import and run the achievement seeding script
    const { seedDatabase } = await import('./seed-achievements');
    await seedDatabase();
    
  } catch (error) {
    throw new Error(`Achievement seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function setupStripeProducts() {
  try {
    console.log('   💳 Setting up Stripe products...');
    
    // Import and run the Stripe setup script
    const { setupStripeProducts } = await import('./setup-stripe-products');
    await setupStripeProducts();
    
  } catch (error) {
    throw new Error(`Stripe setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function importContent() {
  try {
    console.log('   📚 Importing lesson content...');
    
    // Import and run the content import script
    const { importContent } = await import('./import-content');
    await importContent();
    
  } catch (error) {
    throw new Error(`Content import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log('   ℹ️  No ADMIN_EMAIL environment variable set, skipping admin user creation');
    return;
  }

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log(`   ℹ️  Admin user ${adminEmail} already exists`);
      return;
    }

    // Create admin user (they'll need to sign up normally, but we can pre-create the record)
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        subscriptionTier: 'enterprise',
        subscriptionStatus: 'active',
      }
    });

    console.log(`   ✅ Admin user created: ${adminEmail}`);
    
  } catch (error) {
    throw new Error(`Admin user creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function setupMonitoring() {
  // This would set up any monitoring-specific database records or configurations
  console.log('   📊 Setting up monitoring configuration...');
  
  // For now, this is a placeholder for future monitoring setup
  // You might create monitoring dashboard configs, alert thresholds, etc.
  
  console.log('   ℹ️  Monitoring setup is manual - configure Sentry, health check alerts, etc.');
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  });
}