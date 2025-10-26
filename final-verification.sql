-- Final Verification: All Lessons Import Complete
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
