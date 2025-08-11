-- Test query to check current lesson status
SELECT 
  COUNT(*) as total_lessons,
  COUNT(CASE WHEN "isPublished" = true THEN 1 END) as published_lessons,
  COUNT(CASE WHEN "isPublished" = false THEN 1 END) as unpublished_lessons,
  MIN("lessonNumber") as first_lesson,
  MAX("lessonNumber") as last_lesson
FROM lessons;

-- If you want to publish all existing lessons without importing new ones:
-- UPDATE lessons SET "isPublished" = true WHERE "isPublished" = false;
