#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

// Clean environment variable
const cleanEnvVar = (value: string | undefined): string => {
  return value?.replace(/\\n/g, '').trim() || '';
};

const databaseUrl = cleanEnvVar(process.env.DATABASE_URL) || cleanEnvVar(process.env.DIRECT_DATABASE_URL);

console.log('Testing Supabase Database Connection');
console.log('====================================');
console.log('Database URL configured:', !!databaseUrl);

if (!databaseUrl) {
  console.error('❌ No database URL found in environment variables');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  log: ['info', 'warn', 'error']
});

async function testConnection() {
  try {
    console.log('🔗 Attempting to connect to Supabase...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test a simple query
    console.log('📊 Testing basic query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic query successful:', result);

    // Check if lessons table exists and get count
    console.log('📚 Checking lessons table...');
    try {
      const lessonCount = await prisma.lesson.count();
      console.log(`📖 Current lesson count: ${lessonCount}`);
    } catch (error) {
      console.log('⚠️ Lessons table might not exist or is empty');
    }

    // Check if learning paths table exists and get count
    console.log('🛤️ Checking learning paths table...');
    try {
      const pathCount = await prisma.learningPath.count();
      console.log(`🗺️ Current learning path count: ${pathCount}`);
    } catch (error) {
      console.log('⚠️ Learning paths table might not exist or is empty');
    }

    console.log('\n🎉 Connection test completed successfully!');

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testConnection().catch(console.error);
}