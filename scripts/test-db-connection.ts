#!/usr/bin/env tsx
/**
 * Test Database Connection Script
 * Tests production database connectivity and lesson count
 */

import { PrismaClient } from '@prisma/client';

async function testDatabaseConnection() {
  const directUrl = "postgresql://postgres.fsohtauqtcftdjcjfdpq:MaySPWgaFDl4StLd.@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
  const pooledUrl = "postgresql://postgres.fsohtauqtcftdjcjfdpq:MaySPWgaFDl4StLd.@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1&pool_mode=transaction";
  
  console.log('🔍 Testing production database connections...');
  
  // Test direct connection
  console.log('\n📌 Testing DIRECT connection...');
  const directPrisma = new PrismaClient({
    datasources: {
      db: { url: directUrl }
    },
    log: ['error']
  });
  
  try {
    console.log('⏳ Testing basic connectivity...');
    await directPrisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Direct connection successful');
    
    console.log('⏳ Counting lessons...');
    const lessonCount = await directPrisma.lesson.count();
    console.log(`📚 Found ${lessonCount} lessons in database`);
    
    console.log('⏳ Getting sample lessons...');
    const sampleLessons = await directPrisma.lesson.findMany({
      select: {
        id: true,
        lessonNumber: true,
        title: true,
        isPublished: true
      },
      take: 5,
      orderBy: { lessonNumber: 'asc' }
    });
    
    console.log('📋 Sample lessons:');
    sampleLessons.forEach(lesson => {
      console.log(`   - Lesson ${lesson.lessonNumber}: ${lesson.title} ${lesson.isPublished ? '(Published)' : '(Draft)'}`);
    });
    
  } catch (error) {
    console.error('❌ Direct connection failed:', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    await directPrisma.$disconnect();
  }
  
  // Test pooled connection
  console.log('\n📌 Testing POOLED connection...');
  const pooledPrisma = new PrismaClient({
    datasources: {
      db: { url: pooledUrl }
    },
    log: ['error']
  });
  
  try {
    console.log('⏳ Testing basic connectivity...');
    await pooledPrisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Pooled connection successful');
    
    const lessonCount = await pooledPrisma.lesson.count();
    console.log(`📚 Found ${lessonCount} lessons via pooled connection`);
    
  } catch (error) {
    console.error('❌ Pooled connection failed:', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    await pooledPrisma.$disconnect();
  }
  
  console.log('\n🔍 Database connection test completed');
}

testDatabaseConnection().catch(console.error);