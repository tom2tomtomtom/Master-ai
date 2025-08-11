#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting import to Supabase database...');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Check current lesson count
    const currentCount = await prisma.lesson.count();
    console.log(`📊 Current lessons in database: ${currentCount}`);

    if (currentCount > 0) {
      console.log('⚠️  Database already has lessons. Skipping import.');
      console.log('💡 If you want to reimport, clear the database first.');
      return;
    }

    // Import lessons from the parent directory
    const lessonDir = '/Users/thomasdowuona-hyde/Master-AI';
    const lessonFiles = fs.readdirSync(lessonDir)
      .filter(file => file.startsWith('lesson-') && file.endsWith('.md'))
      .sort();

    console.log(`📝 Found ${lessonFiles.length} lesson files to import`);

    let importedCount = 0;

    for (const file of lessonFiles) {
      const filePath = path.join(lessonDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract lesson number from filename
      const lessonNumberMatch = file.match(/lesson-(\d+)/);
      if (!lessonNumberMatch) continue;
      
      const lessonNumber = parseInt(lessonNumberMatch[1]);
      
      // Extract title from content
      const titleMatch = content.match(/^# (.+)$/m);
      const title = titleMatch ? titleMatch[1] : `Lesson ${lessonNumber}`;
      
      // Extract description (first paragraph after title)
      const descriptionMatch = content.match(/^# .+\n\n\*(.+?)\*/m);
      const description = descriptionMatch ? descriptionMatch[1] : '';
      
      // Extract tools (look for common AI tool names)
      const toolsInContent = [];
      const toolKeywords = ['ChatGPT', 'Claude', 'Gemini', 'Midjourney', 'DALL-E', 'Perplexity', 'Stable Diffusion'];
      for (const tool of toolKeywords) {
        if (content.toLowerCase().includes(tool.toLowerCase())) {
          toolsInContent.push(tool);
        }
      }
      
      // Determine difficulty level
      let difficultyLevel = 'Beginner';
      if (content.toLowerCase().includes('advanced') || content.toLowerCase().includes('expert')) {
        difficultyLevel = 'Advanced';
      } else if (content.toLowerCase().includes('intermediate')) {
        difficultyLevel = 'Intermediate';
      }
      
      // Estimate reading time (rough calculation)
      const wordCount = content.split(/\s+/).length;
      const estimatedTime = Math.max(10, Math.ceil(wordCount / 200)); // 200 words per minute
      
      try {
        await prisma.lesson.create({
          data: {
            lessonNumber,
            title,
            description,
            content,
            estimatedTime,
            difficultyLevel,
            tools: toolsInContent,
            isPublished: true,
            isFree: lessonNumber <= 5, // First 6 lessons are free
          },
        });
        
        importedCount++;
        console.log(`✅ Imported: ${title}`);
      } catch (error) {
        console.error(`❌ Failed to import ${file}:`, error);
      }
    }

    console.log(`🎉 Import completed! Imported ${importedCount} lessons.`);
    
    // Verify import
    const finalCount = await prisma.lesson.count();
    const publishedCount = await prisma.lesson.count({ where: { isPublished: true } });
    
    console.log(`📊 Final stats:`);
    console.log(`   Total lessons: ${finalCount}`);
    console.log(`   Published lessons: ${publishedCount}`);
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);