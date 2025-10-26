-- Master-AI Database Performance Indexes
-- Run this script to add indexes for common query patterns

-- User table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status ON users(status) WHERE status != 'active';

-- Session table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at) WHERE expires_at > NOW();

-- API Keys table indexes (if exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NULL OR expires_at > NOW();

-- Audit log indexes (if exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_status ON users(email, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, expires_at) WHERE expires_at > NOW();

-- Full text search indexes (if needed)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', name || ' ' || email));

-- Performance optimization settings
-- Analyze tables after creating indexes
ANALYZE users;
ANALYZE sessions;

-- Optional: Update table statistics more aggressively for frequently updated tables
-- ALTER TABLE sessions SET (autovacuum_analyze_scale_factor = 0.01);
-- ALTER TABLE audit_logs SET (autovacuum_analyze_scale_factor = 0.02);

-- Query to check index usage (run periodically)
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- Query to find missing indexes (based on sequential scans)
/*
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / GREATEST(seq_scan, 1) as avg_tup_per_scan
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND seq_scan > 0
    AND seq_tup_read > 1000
ORDER BY seq_tup_read DESC;
*/
