#!/usr/bin/env tsx

import * as fs from 'fs';

/**
 * Generate smaller SQL batches for Supabase import
 * Split lessons into manageable chunks for SQL Editor
 */

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

async function generateBatchSQLImport() {
  try {
    console.log('🔄 Generating batch SQL import scripts...');
    
    // Load the lessons JSON data
    const jsonFilename = `lessons-data-compressed-${new Date().toISOString().split('T')[0]}.json`;
    
    if (!fs.existsSync(jsonFilename)) {
      console.error(`❌ JSON file not found: ${jsonFilename}`);
      return;
    }
    
    const lessonsData = JSON.parse(fs.readFileSync(jsonFilename, 'utf8'));
    const lessons: LessonData[] = lessonsData.lessons || [];
    
    console.log(`📚 Processing ${lessons.length} lessons for batch SQL generation`);
    
    const BATCH_SIZE = 10; // 10 lessons per batch to stay under size limits
    const batches = [];
    
    for (let i = 0; i < lessons.length; i += BATCH_SIZE) {
      const batch = lessons.slice(i, i + BATCH_SIZE);
      batches.push(batch);
    }
    
    console.log(`📦 Created ${batches.length} batches of ~${BATCH_SIZE} lessons each`);
    
    // Generate batch files
    const createdFiles = [];
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchNumber = batchIndex + 1;
      const startLesson = batch[0].lessonNumber;
      const endLesson = batch[batch.length - 1].lessonNumber;
      
      let sqlContent = `-- Master AI Lessons Import - Batch ${batchNumber}/${batches.length}
-- Generated: ${new Date().toISOString()}
-- Lessons: ${startLesson} to ${endLesson} (${batch.length} lessons)

`;

      let insertStatements: string[] = [];
      
      for (const lesson of batch) {
        try {
          // Escape single quotes in content
          const title = lesson.title.replace(/'/g, "''");
          const description = (lesson.description || '').replace(/'/g, "''");
          
          // Truncate content if too long (keep first 5000 chars to avoid size issues)
          let content = lesson.content.replace(/'/g, "''");
          if (content.length > 5000) {
            content = content.substring(0, 5000) + '... (content truncated for import)';
          }
          
          // Format tools array for PostgreSQL (need single quotes around strings)
          const toolsArray = lesson.tools.length > 0 
            ? lesson.tools.map(tool => `'${tool.replace(/'/g, "''")}'`).join(',')
            : null; // Handle empty arrays
          
          // Generate unique ID
          const id = `lesson_${lesson.lessonNumber.toString().padStart(3, '0')}`;
          
          const insertStatement = `-- Lesson ${lesson.lessonNumber}: ${lesson.title.substring(0, 60)}${lesson.title.length > 60 ? '...' : ''}
INSERT INTO lessons (
  id,
  "lessonNumber", 
  title, 
  description, 
  content, 
  "videoUrl", 
  "videoDuration", 
  "estimatedTime", 
  "difficultyLevel", 
  tools, 
  "isPublished", 
  "isFree",
  "createdAt",
  "updatedAt"
) VALUES (
  '${id}',
  ${lesson.lessonNumber},
  '${title}',
  '${description}',
  '${content}',
  ${lesson.videoUrl ? `'${lesson.videoUrl}'` : 'NULL'},
  ${lesson.videoDuration || 'NULL'},
  ${lesson.estimatedTime || 'NULL'},
  '${lesson.difficultyLevel}',
  ${toolsArray ? `ARRAY[${toolsArray}]` : 'ARRAY[]::text[]'},
  true,
  ${lesson.isFree},
  NOW(),
  NOW()
) ON CONFLICT ("lessonNumber") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  "videoUrl" = EXCLUDED."videoUrl",
  "videoDuration" = EXCLUDED."videoDuration",
  "estimatedTime" = EXCLUDED."estimatedTime",
  "difficultyLevel" = EXCLUDED."difficultyLevel",
  tools = EXCLUDED.tools,
  "isPublished" = true,
  "isFree" = EXCLUDED."isFree",
  "updatedAt" = NOW();`;

          insertStatements.push(insertStatement);
          
        } catch (error) {
          console.error(`❌ Error processing lesson ${lesson.lessonNumber}:`, error);
        }
      }

      sqlContent += insertStatements.join('\n\n');
      
      // Add verification for this batch
      sqlContent += `

-- Verify this batch was imported successfully
SELECT 
  COUNT(*) as imported_in_this_batch,
  MIN("lessonNumber") as first_lesson,
  MAX("lessonNumber") as last_lesson
FROM lessons 
WHERE "lessonNumber" BETWEEN ${startLesson} AND ${endLesson};
`;

      // Write batch file
      const batchFilename = `batch-${batchNumber.toString().padStart(2, '0')}-lessons-${startLesson}-to-${endLesson}.sql`;
      fs.writeFileSync(batchFilename, sqlContent);
      createdFiles.push(batchFilename);
      
      const fileSize = Math.round(sqlContent.length / 1024);
      console.log(`✅ Created ${batchFilename} (${fileSize}KB, ${batch.length} lessons)`);
    }
    
    // Create a final verification script
    const finalVerificationContent = `-- Final Verification: All Lessons Import Complete
-- Run this after importing all batches

SELECT 
  COUNT(*) as total_lessons,
  COUNT(CASE WHEN "isPublished" = true THEN 1 END) as published_lessons,
  COUNT(CASE WHEN "isPublished" = false THEN 1 END) as unpublished_lessons,
  MIN("lessonNumber") as first_lesson,
  MAX("lessonNumber") as last_lesson
FROM lessons;

-- Expected: 86 total lessons, 86 published lessons, 0 unpublished

-- Show lessons by difficulty
SELECT "difficultyLevel", COUNT(*) as count
FROM lessons
GROUP BY "difficultyLevel"
ORDER BY count DESC;

-- Show sample of first 10 lessons
SELECT "lessonNumber", title, "difficultyLevel", array_length(tools, 1) as tool_count, "isPublished"
FROM lessons 
ORDER BY "lessonNumber" 
LIMIT 10;

-- Test API endpoint (this should work after successful import)
-- Visit: https://www.master-ai-learn.com/api/lessons
`;
    
    const verificationFilename = 'final-verification.sql';
    fs.writeFileSync(verificationFilename, finalVerificationContent);
    createdFiles.push(verificationFilename);

    // Create import instructions
    const instructionsContent = `# Master AI Lessons - Batch Import Instructions

## Files Created:
${createdFiles.map((file, index) => {
  if (file.includes('batch')) {
    const match = file.match(/batch-(\d+)-lessons-(\d+)-to-(\d+)/);
    if (match) {
      const batchNum = match[1];
      const start = match[2];
      const end = match[3];
      return `${index + 1}. ${file} - Batch ${batchNum}: Lessons ${start}-${end}`;
    }
  }
  return `${index + 1}. ${file}`;
}).join('\n')}

## Import Steps:

### 1. Go to Supabase SQL Editor
https://supabase.com/dashboard/project/fsohtauqtcftdjcjfdpq/sql

### 2. Import batches in order (DO NOT SKIP):
${batches.map((_, index) => {
  const batchNum = index + 1;
  const filename = createdFiles.find(f => f.includes(`batch-${batchNum.toString().padStart(2, '0')}`));
  return `   ${batchNum}. Copy/paste ${filename} → Click RUN → Wait for success`;
}).join('\n')}

### 3. Final verification:
   Copy/paste final-verification.sql → Click RUN → Confirm 86 total lessons

## Expected Results:
- 86 lessons imported
- All lessons published (isPublished = true)
- Lessons visible at: https://www.master-ai-learn.com/api/lessons
- Website shows lessons in UI

## If Import Fails:
- Each batch is independent - you can re-run failed batches
- Use ON CONFLICT DO UPDATE - safe to re-run
- Check Supabase logs for specific error details

## File Sizes:
${createdFiles.filter(f => f.includes('batch')).map(file => {
  const stats = fs.statSync(file);
  const sizeKB = Math.round(stats.size / 1024);
  return `- ${file}: ${sizeKB}KB`;
}).join('\n')}

Total batches: ${batches.length}
Max file size: ~${Math.max(...createdFiles.filter(f => f.includes('batch')).map(f => Math.round(fs.statSync(f).size / 1024)))}KB (well under SQL Editor limits)
`;

    fs.writeFileSync('IMPORT_INSTRUCTIONS.md', instructionsContent);
    createdFiles.push('IMPORT_INSTRUCTIONS.md');

    console.log(`\n🎉 Batch SQL import generation complete!`);
    console.log(`📁 Created ${createdFiles.length} files:`);
    createdFiles.forEach(file => {
      const size = Math.round(fs.statSync(file).size / 1024);
      console.log(`   ${file} (${size}KB)`);
    });
    
    console.log(`\n🎯 Next Steps:`);
    console.log(`1. Open IMPORT_INSTRUCTIONS.md for detailed steps`);
    console.log(`2. Import batches 1-${batches.length} in order via Supabase SQL Editor`);
    console.log(`3. Run final verification`);
    console.log(`4. Test production website`);
    console.log(`\n✅ Each batch is <100KB - safe for SQL Editor!`);

  } catch (error) {
    console.error('❌ Failed to generate batch SQL:', error);
  }
}

generateBatchSQLImport().catch(console.error);