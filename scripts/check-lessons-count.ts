#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

/**
 * Simple script to check how many lessons are in the database
 */

const prisma = new PrismaClient();

async function checkLessons() {
  try {
    console.log('🔍 Checking lessons in Supabase database...');
    
    const totalLessons = await prisma.lesson.count();
    console.log(`📊 Total lessons in database: ${totalLessons}`);
    
    if (totalLessons > 0) {
      const publishedLessons = await prisma.lesson.count({ 
        where: { isPublished: true } 
      });
      console.log(`🌐 Published lessons: ${publishedLessons}`);
      
      // Get first few lessons
      const sampleLessons = await prisma.lesson.findMany({
        select: {
          lessonNumber: true,
          title: true,
          isPublished: true
        },
        orderBy: { lessonNumber: 'asc' },
        take: 5
      });
      
      console.log('\n📚 Sample lessons:');
      sampleLessons.forEach(lesson => {
        console.log(`  ${lesson.lessonNumber}: ${lesson.title} ${lesson.isPublished ? '✅' : '❌'}`);
      });
      
      console.log('\n✅ Lessons exist in database!');
      console.log('🔍 If lessons aren\'t showing in UI, check:');
      console.log('  1. API endpoint errors');
      console.log('  2. Frontend data fetching');
      console.log('  3. Authentication requirements');
      
    } else {
      console.log('\n❌ No lessons found in database');
      console.log('📥 Need to import lessons data');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    
    if (error instanceof Error && error.message.includes('P1001')) {
      console.log('\n💡 Cannot connect to Supabase database');
      console.log('🔧 Possible solutions:');
      console.log('  1. Check DATABASE_URL in .env file');
      console.log('  2. Verify Supabase database is active');
      console.log('  3. Check network/firewall settings');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkLessons();