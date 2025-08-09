-- Performance optimization indexes for Master-AI application
-- Generated: 2024-12-10

-- User Progress table indexes (most critical for dashboard performance)
-- Index for user's progress queries
CREATE INDEX IF NOT EXISTS "idx_user_progress_user_id" ON "user_progress"("userId");

-- Composite index for user progress with last accessed (for recent activity)
CREATE INDEX IF NOT EXISTS "idx_user_progress_user_last_accessed" ON "user_progress"("userId", "lastAccessed" DESC NULLS LAST);

-- Index for lesson completion queries
CREATE INDEX IF NOT EXISTS "idx_user_progress_lesson_status" ON "user_progress"("lessonId", "status");

-- Index for progress percentage queries (for analytics)
CREATE INDEX IF NOT EXISTS "idx_user_progress_completed" ON "user_progress"("userId", "completedAt") WHERE "status" = 'completed';

-- Lesson table indexes
-- Index for published lessons (main lesson list queries)
CREATE INDEX IF NOT EXISTS "idx_lessons_published" ON "lessons"("isPublished", "lessonNumber") WHERE "isPublished" = true;

-- GIN index for tools array queries (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS "idx_lessons_tools" ON "lessons" USING gin("tools");

-- Index for free lessons
CREATE INDEX IF NOT EXISTS "idx_lessons_free" ON "lessons"("isFree", "lessonNumber") WHERE "isFree" = true;

-- Index for lesson difficulty queries
CREATE INDEX IF NOT EXISTS "idx_lessons_difficulty" ON "lessons"("difficultyLevel", "lessonNumber") WHERE "difficultyLevel" IS NOT NULL;

-- Notes and Bookmarks indexes
-- Index for user's notes
CREATE INDEX IF NOT EXISTS "idx_lesson_notes_user" ON "lesson_notes"("userId", "createdAt" DESC);

-- Index for lesson-specific notes
CREATE INDEX IF NOT EXISTS "idx_lesson_notes_lesson" ON "lesson_notes"("lessonId", "createdAt" DESC);

-- Index for user bookmarks
CREATE INDEX IF NOT EXISTS "idx_lesson_bookmarks_user" ON "lesson_bookmarks"("userId", "createdAt" DESC);

-- Learning Path Performance
-- Index for learning paths (no LearningPathProgress table, but add index for learning_paths)
CREATE INDEX IF NOT EXISTS "idx_learning_paths_active" ON "learning_paths"("isActive", "order") WHERE "isActive" = true;

-- User table performance indexes
-- Index for user role queries (admin functionality)
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role") WHERE "role" != 'USER';

-- Index for user creation date (for analytics)
CREATE INDEX IF NOT EXISTS "idx_users_created" ON "users"("createdAt" DESC);

-- Subscription related indexes (if applicable)
-- Index for subscription tier queries
CREATE INDEX IF NOT EXISTS "idx_users_subscription" ON "users"("subscriptionTier", "subscriptionStatus");

-- Composite indexes for common dashboard queries
-- Users with recent progress
CREATE INDEX IF NOT EXISTS "idx_dashboard_recent_activity" ON "user_progress"("userId", "lastAccessed" DESC, "status") WHERE "lastAccessed" IS NOT NULL;

-- Performance monitoring
-- Add comments to track index usage
COMMENT ON INDEX "idx_user_progress_user_id" IS 'Primary index for user progress queries';
COMMENT ON INDEX "idx_user_progress_user_last_accessed" IS 'Dashboard recent activity optimization';
COMMENT ON INDEX "idx_lessons_published" IS 'Main lesson list performance';
COMMENT ON INDEX "idx_lessons_tools" IS 'AI tool filtering optimization';

-- Analyze tables after index creation
ANALYZE "user_progress";
ANALYZE "lessons";
ANALYZE "users";
ANALYZE "lesson_notes";
ANALYZE "lesson_bookmarks";