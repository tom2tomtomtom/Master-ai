-- Database Indexes for Master-AI SaaS Performance Optimization
-- These indexes are designed to optimize the most frequent query patterns
-- identified in the achievement system, certification engine, and dashboard APIs

-- User Progress Indexes (heavily used in dashboard and progress tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_status 
ON user_progress(userId, status) 
WHERE status IN ('completed', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_completed_at 
ON user_progress(userId, completedAt DESC) 
WHERE completedAt IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_last_accessed 
ON user_progress(userId, lastAccessed DESC) 
WHERE lastAccessed IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_lesson_user 
ON user_progress(lessonId, userId);

-- User Stats Indexes (for achievement calculations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_activity_date 
ON user_stats(lastActivityDate DESC) 
WHERE lastActivityDate IS NOT NULL;

-- User Achievement Indexes (for leaderboards and progress tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievement_user_earned 
ON user_achievements(userId, earnedAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievement_achievement_earned 
ON user_achievements(achievementId, earnedAt DESC);

-- Achievement Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievement_active_category 
ON achievements(isActive, category, displayOrder) 
WHERE isActive = true;

-- User Certification Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_cert_user_earned 
ON user_certifications(userId, earnedAt DESC) 
WHERE isRevoked = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_cert_verification 
ON user_certifications(verificationCode) 
WHERE isRevoked = false;

-- Certification Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certification_active 
ON certifications(isActive, displayOrder) 
WHERE isActive = true;

-- Lesson Notes Indexes (for dashboard activity)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_note_user_created 
ON lesson_notes(userId, createdAt DESC);

-- Lesson Bookmarks Indexes (for dashboard activity)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_bookmark_user_created 
ON lesson_bookmarks(userId, createdAt DESC);

-- Lesson Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_published 
ON lessons(isPublished, lessonNumber) 
WHERE isPublished = true;

-- Learning Path Lesson Indexes (for certification path completion)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_path_lesson_path 
ON learning_path_lessons(learningPathId, "order", isRequired);

-- Composite Indexes for Complex Queries

-- User progress with lesson data (for dashboard stats)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_composite 
ON user_progress(userId, status, completedAt DESC, timeSpentMinutes) 
WHERE status IN ('completed', 'in_progress');

-- Achievement leaderboard optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievement_leaderboard 
ON user_achievements(userId) 
INCLUDE (achievementId, earnedAt);

-- User activity for background jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_active_users 
ON user_progress(lastAccessed DESC, userId) 
WHERE lastAccessed > CURRENT_DATE - INTERVAL '30 days';

-- Partial Indexes for Better Performance

-- Only index completed lessons for streak calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_completed_streak 
ON user_progress(userId, completedAt::date) 
WHERE status = 'completed' AND completedAt IS NOT NULL;

-- Only index active achievements
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievement_active_only 
ON achievements(category, displayOrder, pointsAwarded) 
WHERE isActive = true;

-- Only index non-revoked certifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_cert_active_only 
ON user_certifications(userId, certificationId, earnedAt) 
WHERE isRevoked = false;

-- Full-text Search Indexes (if needed for lesson search)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_fulltext 
-- ON lessons USING gin(to_tsvector('english', title || ' ' || description)) 
-- WHERE isPublished = true;

-- Statistics for Query Planner (run after creating indexes)
-- ANALYZE user_progress;
-- ANALYZE user_achievements;
-- ANALYZE user_certifications;
-- ANALYZE user_stats;
-- ANALYZE achievements;
-- ANALYZE certifications;
-- ANALYZE lesson_notes;
-- ANALYZE lesson_bookmarks;
-- ANALYZE lessons;

-- Monitor Index Usage (helpful queries for performance monitoring)
/*
-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Check table scan vs index scan ratio
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    CASE 
        WHEN seq_scan + idx_scan > 0 
        THEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2) 
        ELSE 0 
    END as index_usage_pct
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY index_usage_pct ASC;

-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
AND schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;
*/