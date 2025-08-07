-- Database Performance Optimization Indexes
-- Adds critical indexes for Master-AI SaaS application
-- Focus: User progress queries, dashboard queries, achievement system

-- =============================================================================
-- USER PROGRESS PERFORMANCE INDEXES
-- =============================================================================

-- Primary user progress queries (dashboard stats, recent activity)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_status 
ON user_progress(user_id, status) 
WHERE status IN ('completed', 'in_progress');

-- Dashboard activity queries (recent completions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_completed_at 
ON user_progress(user_id, completed_at DESC, status) 
WHERE completed_at IS NOT NULL;

-- Recent activity with last accessed
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_last_accessed 
ON user_progress(user_id, last_accessed DESC, status) 
WHERE last_accessed IS NOT NULL;

-- Achievement system streak calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_date_range 
ON user_progress(user_id, completed_at, status) 
WHERE status = 'completed' AND completed_at IS NOT NULL;

-- =============================================================================
-- ACHIEVEMENT SYSTEM INDEXES
-- =============================================================================

-- User achievements lookup (leaderboard, progress checking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_user_earned 
ON user_achievements(user_id, earned_at DESC);

-- Achievement eligibility checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_achievement_id 
ON user_achievements(achievement_id, user_id);

-- Leaderboard queries (count by user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_leaderboard 
ON user_achievements(user_id, achievement_id) 
WHERE is_visible = true;

-- Active achievements filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievements_active_order 
ON achievements(is_active, display_order) 
WHERE is_active = true;

-- =============================================================================
-- CERTIFICATION SYSTEM INDEXES
-- =============================================================================

-- User certifications lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_certifications_user_active 
ON user_certifications(user_id, is_revoked, earned_at DESC) 
WHERE is_revoked = false;

-- Certification eligibility checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_certifications_cert_id 
ON user_certifications(certification_id, user_id) 
WHERE is_revoked = false;

-- Verification code lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_certifications_verification 
ON user_certifications(verification_code) 
WHERE is_revoked = false;

-- Active certifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certifications_active 
ON certifications(is_active, display_order) 
WHERE is_active = true;

-- =============================================================================
-- NOTES AND BOOKMARKS INDEXES
-- =============================================================================

-- User notes by lesson and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_notes_user_created 
ON lesson_notes(user_id, created_at DESC);

-- User bookmarks by lesson and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_bookmarks_user_created 
ON lesson_bookmarks(user_id, created_at DESC);

-- Lesson-specific notes (for lesson detail pages)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_notes_lesson_user 
ON lesson_notes(lesson_id, user_id, created_at DESC);

-- =============================================================================
-- LEARNING PATH INDEXES
-- =============================================================================

-- Learning path lesson relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_path_lessons_path_order 
ON learning_path_lessons(learning_path_id, "order", is_required);

-- Learning path lesson lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_path_lessons_lesson 
ON learning_path_lessons(lesson_id, learning_path_id, is_required);

-- Active learning paths
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_paths_active_order 
ON learning_paths(is_active, "order") 
WHERE is_active = true;

-- =============================================================================
-- USER STATISTICS INDEXES
-- =============================================================================

-- User stats lookup (frequent in achievement/dashboard systems)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_user_updated 
ON user_stats(user_id, updated_at DESC);

-- Statistics for leaderboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_points_lessons 
ON user_stats(total_points_earned DESC, total_lessons_completed DESC);

-- Streak-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_streak 
ON user_stats(current_streak DESC, longest_streak DESC);

-- =============================================================================
-- LESSON AND CONTENT INDEXES
-- =============================================================================

-- Published lessons (most common filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_published_number 
ON lessons(is_published, lesson_number) 
WHERE is_published = true;

-- Free lessons for unauthenticated access
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_free_published 
ON lessons(is_free, is_published, lesson_number) 
WHERE is_free = true AND is_published = true;

-- =============================================================================
-- SESSION AND AUTHENTICATION INDEXES
-- =============================================================================

-- Session token lookups (NextAuth.js optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token_expires 
ON sessions(session_token, expires) 
WHERE expires > NOW();

-- User email lookups (login optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email));

-- Password reset token lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_reset_token_expires 
ON users(reset_token, reset_token_expires) 
WHERE reset_token IS NOT NULL AND reset_token_expires > NOW();

-- =============================================================================
-- SUBSCRIPTION AND BILLING INDEXES
-- =============================================================================

-- Active subscriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_status 
ON users(subscription_status, subscription_tier, subscription_ends_at) 
WHERE subscription_status = 'active';

-- Stripe customer lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stripe_customers_user 
ON stripe_customers(user_id, stripe_customer_id);

-- =============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =============================================================================

-- Dashboard stats composite query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_dashboard_stats 
ON user_progress(user_id, status, completed_at, time_spent_minutes) 
WHERE status IN ('completed', 'in_progress');

-- Achievement system user activity composite
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_composite 
ON user_progress(user_id, status, completed_at, last_accessed) 
WHERE completed_at IS NOT NULL OR last_accessed IS NOT NULL;

-- Certification eligibility composite
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certification_eligibility_composite 
ON user_progress(user_id, lesson_id, status, completed_at) 
WHERE status = 'completed';

-- =============================================================================
-- PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- =============================================================================

-- Only index non-revoked certifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_certs_active_only 
ON user_certifications(user_id, certification_id, earned_at DESC) 
WHERE is_revoked = false;

-- Only index visible achievements
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_visible_only 
ON user_achievements(user_id, earned_at DESC) 
WHERE is_visible = true;

-- Only index active/recent user sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_recent_activity 
ON user_progress(user_id, last_accessed DESC) 
WHERE last_accessed > (NOW() - INTERVAL '30 days');

-- =============================================================================
-- EXPRESSION INDEXES FOR COMPUTED QUERIES
-- =============================================================================

-- Index on date extraction for streak calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_completion_date 
ON user_progress(user_id, DATE(completed_at)) 
WHERE completed_at IS NOT NULL AND status = 'completed';

-- Index for time-based activity grouping
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_weekly_activity 
ON user_progress(user_id, DATE_TRUNC('week', completed_at)) 
WHERE completed_at IS NOT NULL AND status = 'completed';

-- =============================================================================
-- CLEANUP AND OPTIMIZATION HINTS
-- =============================================================================

-- Update table statistics after adding indexes
ANALYZE user_progress;
ANALYZE user_achievements;
ANALYZE user_certifications;
ANALYZE lesson_notes;
ANALYZE lesson_bookmarks;
ANALYZE user_stats;
ANALYZE lessons;
ANALYZE learning_paths;
ANALYZE learning_path_lessons;

-- Performance monitoring views could be added here
-- These would be separate files for monitoring