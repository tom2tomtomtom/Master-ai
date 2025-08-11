# Master AI Lessons - Batch Import Instructions

## Files Created:
1. batch-01-lessons-0-to-9.sql - Batch 01: Lessons 0-9
2. batch-02-lessons-10-to-19.sql - Batch 02: Lessons 10-19
3. batch-03-lessons-20-to-29.sql - Batch 03: Lessons 20-29
4. batch-04-lessons-30-to-39.sql - Batch 04: Lessons 30-39
5. batch-05-lessons-40-to-49.sql - Batch 05: Lessons 40-49
6. batch-06-lessons-50-to-62.sql - Batch 06: Lessons 50-62
7. batch-07-lessons-63-to-72.sql - Batch 07: Lessons 63-72
8. batch-08-lessons-73-to-82.sql - Batch 08: Lessons 73-82
9. batch-09-lessons-83-to-88.sql - Batch 09: Lessons 83-88
10. final-verification.sql

## Import Steps:

### 1. Go to Supabase SQL Editor
https://supabase.com/dashboard/project/fsohtauqtcftdjcjfdpq/sql

### 2. Import batches in order (DO NOT SKIP):
   1. Copy/paste batch-01-lessons-0-to-9.sql → Click RUN → Wait for success
   2. Copy/paste batch-02-lessons-10-to-19.sql → Click RUN → Wait for success
   3. Copy/paste batch-03-lessons-20-to-29.sql → Click RUN → Wait for success
   4. Copy/paste batch-04-lessons-30-to-39.sql → Click RUN → Wait for success
   5. Copy/paste batch-05-lessons-40-to-49.sql → Click RUN → Wait for success
   6. Copy/paste batch-06-lessons-50-to-62.sql → Click RUN → Wait for success
   7. Copy/paste batch-07-lessons-63-to-72.sql → Click RUN → Wait for success
   8. Copy/paste batch-08-lessons-73-to-82.sql → Click RUN → Wait for success
   9. Copy/paste batch-09-lessons-83-to-88.sql → Click RUN → Wait for success

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
- batch-01-lessons-0-to-9.sql: 59KB
- batch-02-lessons-10-to-19.sql: 59KB
- batch-03-lessons-20-to-29.sql: 59KB
- batch-04-lessons-30-to-39.sql: 59KB
- batch-05-lessons-40-to-49.sql: 60KB
- batch-06-lessons-50-to-62.sql: 60KB
- batch-07-lessons-63-to-72.sql: 60KB
- batch-08-lessons-73-to-82.sql: 60KB
- batch-09-lessons-83-to-88.sql: 36KB

Total batches: 9
Max file size: ~60KB (well under SQL Editor limits)
