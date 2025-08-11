#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function exportLessonsAsSQL() {
  console.log('🔄 Exporting lessons and learning paths as SQL...');
  
  try {
    // Get all lessons
    const lessons = await prisma.lesson.findMany({
      orderBy: { lessonNumber: 'asc' }
    });
    
    // Get all learning paths
    const learningPaths = await prisma.learningPath.findMany({
      orderBy: { order: 'asc' }
    });
    
    // Get all learning path lesson associations
    const pathLessons = await prisma.learningPathLesson.findMany({
      include: {
        lesson: true,
        learningPath: true
      },
      orderBy: [
        { learningPathId: 'asc' },
        { order: 'asc' }
      ]
    });
    
    console.log(`📚 Found ${lessons.length} lessons`);
    console.log(`🛤️ Found ${learningPaths.length} learning paths`);
    console.log(`🔗 Found ${pathLessons.length} path-lesson associations`);
    
    let sql = '';
    
    // Add header comment
    sql += '-- Master-AI Database Export\n';
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Lessons: ${lessons.length}, Learning Paths: ${learningPaths.length}\n\n`;
    
    // Clear existing data first
    sql += '-- Clear existing data\n';
    sql += 'DELETE FROM "LearningPathLesson";\n';
    sql += 'DELETE FROM "UserProgress";\n';
    sql += 'DELETE FROM "LessonNote";\n';
    sql += 'DELETE FROM "LessonBookmark";\n';
    sql += 'DELETE FROM "Exercise";\n';
    sql += 'DELETE FROM "Lesson";\n';
    sql += 'DELETE FROM "LearningPath";\n\n';
    
    // Insert lessons
    sql += '-- Insert Lessons\n';
    for (const lesson of lessons) {
      const values = [
        `'${lesson.id}'`,
        lesson.lessonNumber,
        `'${lesson.title.replace(/'/g, "''")}'`,
        `'${lesson.description.replace(/'/g, "''")}'`,
        `$content$${lesson.content}$content$`,
        lesson.videoUrl ? `'${lesson.videoUrl}'` : 'NULL',
        lesson.videoDuration || 'NULL',
        lesson.estimatedTime,
        `'${lesson.difficultyLevel}'`,
        `ARRAY[${lesson.tools.map(tool => `'${tool.replace(/'/g, "''")}'`).join(', ')}]`,
        lesson.isPublished ? 'true' : 'false',
        lesson.isFree ? 'true' : 'false',
        `'${lesson.createdAt?.toISOString() || new Date().toISOString()}'`,
        `'${lesson.updatedAt?.toISOString() || new Date().toISOString()}'`
      ].join(', ');
      
      sql += `INSERT INTO "Lesson" (id, "lessonNumber", title, description, content, "videoUrl", "videoDuration", "estimatedTime", "difficultyLevel", tools, "isPublished", "isFree", "createdAt", "updatedAt") VALUES (${values}) ON CONFLICT ("lessonNumber") DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, content = EXCLUDED.content, "videoUrl" = EXCLUDED."videoUrl", "videoDuration" = EXCLUDED."videoDuration", "estimatedTime" = EXCLUDED."estimatedTime", "difficultyLevel" = EXCLUDED."difficultyLevel", tools = EXCLUDED.tools, "isPublished" = EXCLUDED."isPublished", "isFree" = EXCLUDED."isFree", "updatedAt" = EXCLUDED."updatedAt";\n`;
    }
    
    sql += '\n-- Insert Learning Paths\n';
    for (const path of learningPaths) {
      const values = [
        `'${path.id}'`,
        `'${path.name.replace(/'/g, "''")}'`,
        `'${path.description.replace(/'/g, "''")}'`,
        `'${path.targetAudience.replace(/'/g, "''")}'`,
        path.estimatedHours,
        `'${path.difficultyLevel}'`,
        `'${path.color}'`,
        `'${path.icon}'`,
        path.order,
        `'${path.createdAt?.toISOString() || new Date().toISOString()}'`,
        `'${path.updatedAt?.toISOString() || new Date().toISOString()}'`
      ].join(', ');
      
      sql += `INSERT INTO "LearningPath" (id, name, description, "targetAudience", "estimatedHours", "difficultyLevel", color, icon, "order", "createdAt", "updatedAt") VALUES (${values}) ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, "targetAudience" = EXCLUDED."targetAudience", "estimatedHours" = EXCLUDED."estimatedHours", "difficultyLevel" = EXCLUDED."difficultyLevel", color = EXCLUDED.color, icon = EXCLUDED.icon, "order" = EXCLUDED."order", "updatedAt" = EXCLUDED."updatedAt";\n`;
    }
    
    sql += '\n-- Insert Learning Path Lesson Associations\n';
    for (const pathLesson of pathLessons) {
      const values = [
        `'${pathLesson.id}'`,
        `'${pathLesson.learningPathId}'`,
        `'${pathLesson.lessonId}'`,
        pathLesson.order,
        pathLesson.isRequired ? 'true' : 'false',
        `'${pathLesson.createdAt?.toISOString() || new Date().toISOString()}'`
      ].join(', ');
      
      sql += `INSERT INTO "LearningPathLesson" (id, "learningPathId", "lessonId", "order", "isRequired", "createdAt") VALUES (${values}) ON CONFLICT ("learningPathId", "lessonId") DO UPDATE SET "order" = EXCLUDED."order", "isRequired" = EXCLUDED."isRequired";\n`;
    }
    
    // Add final statistics comment
    sql += `\n-- Export completed: ${lessons.length} lessons, ${learningPaths.length} paths, ${pathLessons.length} associations\n`;
    
    // Write to file
    const fs = require('fs');
    const filename = `master-ai-export-${new Date().toISOString().split('T')[0]}.sql`;
    fs.writeFileSync(filename, sql);
    
    console.log(`\n✅ Export completed!`);
    console.log(`📝 SQL file: ${filename}`);
    console.log(`📊 Statistics:`);
    console.log(`  - ${lessons.length} lessons exported`);
    console.log(`  - ${learningPaths.length} learning paths exported`);
    console.log(`  - ${pathLessons.length} associations exported`);
    console.log(`\n🚀 To import into production:`);
    console.log(`   1. Upload this SQL file to your Supabase dashboard`);
    console.log(`   2. Or use: psql $DATABASE_URL -f ${filename}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  exportLessonsAsSQL().catch(console.error);
}