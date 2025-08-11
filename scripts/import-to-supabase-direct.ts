#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

/**
 * Direct import to Supabase database
 * Bypasses API and imports lessons directly via Prisma
 */

// Use environment variables
const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ No DATABASE_URL found. Please check your .env file.');
  process.exit(1);
}

console.log('🔗 Connecting to database...');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

interface LessonData {
  lessonNumber: number;
  title: string;
  description: string;
  content: string;
  htmlContent: string;
  tools: string[];
  estimatedTime: number;
  difficultyLevel: string;
  videoUrl?: string;
  videoDuration?: number;
  isFree: boolean;
}

async function importLessonsToSupabase() {
  try {
    console.log('📂 Loading lessons data...');
    
    const jsonFilename = `lessons-data-compressed-${new Date().toISOString().split('T')[0]}.json`;
    
    if (!fs.existsSync(jsonFilename)) {
      console.error(`❌ JSON file not found: ${jsonFilename}`);
      console.log('Available files:');
      const files = fs.readdirSync('.').filter(f => f.includes('lessons-data'));
      files.forEach(file => console.log(`  - ${file}`));
      return;
    }
    
    const lessonsData = JSON.parse(fs.readFileSync(jsonFilename, 'utf8'));
    const lessons: LessonData[] = lessonsData.lessons || [];
    
    console.log(`📚 Loaded ${lessons.length} lessons`);
    
    // Check current database state
    console.log('\n📊 Checking current database...');
    const currentLessons = await prisma.lesson.count();
    console.log(`Current lessons in database: ${currentLessons}`);
    
    if (currentLessons > 0) {
      console.log('⚠️  Database already has lessons. This will add new ones or update existing ones.');
    }
    
    console.log('\n🔄 Starting import...');
    let successful = 0;
    let failed = 0;
    let updated = 0;
    
    for (const lesson of lessons) {
      try {
        // Check if lesson already exists
        const existingLesson = await prisma.lesson.findFirst({
          where: { lessonNumber: lesson.lessonNumber }
        });
        
        const lessonData = {
          lessonNumber: lesson.lessonNumber,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          htmlContent: lesson.htmlContent,
          tools: lesson.tools,
          estimatedTime: lesson.estimatedTime,
          difficultyLevel: lesson.difficultyLevel as any,
          videoUrl: lesson.videoUrl,
          videoDuration: lesson.videoDuration,
          isFree: lesson.isFree,
          isPublished: true, // Make lessons visible
        };
        
        if (existingLesson) {
          // Update existing lesson
          await prisma.lesson.update({
            where: { id: existingLesson.id },
            data: lessonData
          });
          updated++;
          console.log(`✅ Updated lesson ${lesson.lessonNumber}: ${lesson.title.substring(0, 50)}...`);
        } else {
          // Create new lesson
          await prisma.lesson.create({
            data: lessonData
          });
          successful++;
          console.log(`✅ Created lesson ${lesson.lessonNumber}: ${lesson.title.substring(0, 50)}...`);
        }
        
      } catch (error) {
        failed++;
        console.error(`❌ Failed to import lesson ${lesson.lessonNumber}:`, error);
      }
    }
    
    console.log('\n🎉 Import completed!');
    console.log(`✅ Created: ${successful}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    
    // Final stats
    const finalCount = await prisma.lesson.count();
    const publishedCount = await prisma.lesson.count({ where: { isPublished: true } });
    
    console.log('\n📊 Final Database Stats:');
    console.log(`📚 Total Lessons: ${finalCount}`);
    console.log(`🌐 Published Lessons: ${publishedCount}`);
    
    console.log('\n🌐 Testing lesson API...');
    console.log('You can now test: https://www.master-ai-learn.com/api/lessons');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('P1001')) {
        console.log('\n💡 Database connection failed. Check:');
        console.log('  1. Supabase database is running');
        console.log('  2. DATABASE_URL is correct in .env');
        console.log('  3. Network connection allows access to Supabase');
      }
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importLessonsToSupabase();