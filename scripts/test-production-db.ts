#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing production database queries...');
  
  try {
    // Test basic connection
    console.log('📡 Testing connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful');

    // Count all lessons
    const totalLessons = await prisma.lesson.count();
    console.log(`📊 Total lessons: ${totalLessons}`);

    // Count published lessons  
    const publishedLessons = await prisma.lesson.count({
      where: { isPublished: true }
    });
    console.log(`📊 Published lessons: ${publishedLessons}`);

    // Test the exact query used by the lessons page
    console.log('\n🔍 Testing lessons page query...');
    const lessons = await prisma.lesson.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        lessonNumber: true,
        title: true,
        description: true,
        estimatedTime: true,
        difficultyLevel: true,
        isFree: true,
        tools: true,
      },
      orderBy: { lessonNumber: 'asc' },
      take: 10, // First 10 lessons
    });

    console.log(`✅ Found ${lessons.length} lessons from query`);
    
    // Show first few lessons
    console.log('\n📝 First 5 lessons:');
    lessons.slice(0, 5).forEach((lesson, index) => {
      console.log(`${index + 1}. [${lesson.lessonNumber}] ${lesson.title}`);
      console.log(`   - Free: ${lesson.isFree}, Difficulty: ${lesson.difficultyLevel}`);
      console.log(`   - Tools: ${lesson.tools?.join(', ') || 'None'}`);
    });

    // Test API-style query
    console.log('\n🌐 Testing API-style query...');
    const apiResults = await prisma.lesson.findMany({
      where: { 
        isPublished: true 
      },
      take: 20,
      orderBy: { lessonNumber: 'asc' },
    });
    
    console.log(`✅ API query returned ${apiResults.length} lessons`);

  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    // Additional debugging
    console.log('\n🔍 Error details:');
    if (error instanceof Error) {
      console.log(`Message: ${error.message}`);
      console.log(`Stack: ${error.stack?.split('\n')[0]}`);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);