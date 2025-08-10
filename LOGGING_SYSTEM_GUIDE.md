# Comprehensive Structured Logging System

## Overview

This Master-AI SaaS application now features a comprehensive structured logging system built with Winston, providing:

- **Structured JSON Logging**: All logs are in JSON format with consistent fields
- **Request Correlation**: Every API request gets a unique ID for tracing
- **Security Event Logging**: Authentication, XSS attempts, and unauthorized access
- **Performance Monitoring**: Database queries, API response times, slow operations
- **User Activity Tracking**: Profile updates, lesson progress, subscription changes
- **Error Handling**: Comprehensive error tracking with context
- **Production Features**: Log rotation, retention policies, and monitoring dashboards

## Architecture

### Core Components

1. **Logger (`src/lib/logger.ts`)**
   - Winston-based structured logger with multiple transports
   - Categorized logging (security, performance, user_activity, system, error)
   - Automatic data sanitization to remove sensitive information
   - Environment-specific configuration

2. **API Logging Middleware (`src/lib/api-logging-middleware.ts`)**
   - Automatic request/response logging for all API routes
   - Request correlation with unique IDs
   - Performance timing for all endpoints
   - Integration with authentication system

3. **Database Logging (`src/lib/prisma-logging.ts`)**
   - Prisma extension for automatic query logging
   - Performance monitoring with slow query detection
   - Query analysis and regression detection
   - Transaction logging

4. **Client-Side Logging (`src/lib/client-logger.ts`)**
   - Browser error tracking
   - User interaction logging
   - Performance metrics collection
   - Automatic batching and retry logic

5. **Security Integration**
   - XSS attempt detection and logging
   - Rate limiting with logging
   - Authentication event tracking
   - Input sanitization with threat detection

## Implementation Examples

### 1. API Route with Logging

```typescript
import { withApiLogging, ApiLogContext } from '@/lib/api-logging-middleware';

async function myApiHandler(request: NextRequest, context: ApiLogContext) {
  // Your API logic here
  // Automatic logging of request/response, errors, and performance
}

export const POST = withApiLogging(myApiHandler);
```

### 2. Authentication Events

```typescript
import { appLogger } from '@/lib/logger';

// Successful login
appLogger.security.loginSuccess(user, requestMetadata);

// Failed login attempt
appLogger.security.loginFailure(email, reason, requestMetadata);

// Password reset
appLogger.security.passwordResetRequested(email, requestMetadata);
```

### 3. User Activity Logging

```typescript
// Profile update
appLogger.userActivity.profileUpdated(user, changedFields, requestMetadata);

// Lesson completion
appLogger.userActivity.lessonCompleted(user, lessonId, lessonTitle, duration);

// Subscription change
appLogger.userActivity.subscriptionChanged(user, oldTier, newTier, requestMetadata);
```

### 4. Performance Monitoring

```typescript
import { createTimer } from '@/lib/logger';

const timer = createTimer('expensive_operation');
// ... perform operation
const duration = timer.end();

// Database performance
appLogger.performance.databaseQuery('SELECT', 'users', duration, recordCount);

// API performance  
appLogger.performance.apiRequest(endpoint, duration, statusCode, metadata);
```

### 5. Error Handling

```typescript
try {
  // risky operation
} catch (error) {
  appLogger.error.apiError(endpoint, error, requestMetadata, user);
}
```

### 6. Client-Side Usage

```typescript
import { clientLogger, logError, logPageView } from '@/lib/client-logger';

// Automatic error tracking is set up, but you can also manually log:
logError(new Error('Something went wrong'), { component: 'UserProfile' });

// Page view tracking
logPageView('/dashboard');

// User interactions
clientLogger.logUserInteraction('button_click', 'subscribe_button');
```

## Log Categories and Events

### Security Events
- `login_success`: Successful user authentication
- `login_failure`: Failed login attempts with reasons
- `logout`: User logout events
- `password_reset_requested`: Password reset requests
- `password_reset_completed`: Password reset completions
- `xss_attempt_blocked`: XSS attempts detected and blocked
- `unauthorized_access`: Access attempts to protected resources
- `rate_limit_exceeded`: Rate limiting triggered

### Performance Events  
- `api_request`: All API endpoint performance
- `database_query`: Database operation performance
- `slow_operation`: Operations exceeding thresholds
- `cache_hit`/`cache_miss`: Cache performance

### User Activity Events
- `profile_updated`: User profile modifications
- `lesson_started`: Lesson engagement tracking
- `lesson_completed`: Lesson completion with duration
- `subscription_changed`: Subscription tier changes

### System Events
- `application_startup`: Server initialization
- `application_shutdown`: Graceful shutdown
- `configuration_changed`: Config modifications
- `health_check`: System health monitoring

### Error Events
- `unhandled_error`: Unexpected errors
- `api_error`: API endpoint errors
- `database_error`: Database operation errors
- `validation_error`: Input validation failures
- `external_service_error`: Third-party service errors

## Configuration

### Environment Variables

```bash
# Logging Configuration
NODE_ENV=production                    # Environment mode
LOG_LEVEL=info                        # Minimum log level
ENABLE_FILE_LOGGING=true              # Enable file-based logging
LOG_RETENTION_DAYS=30                 # Log retention period
MAX_LOG_FILE_SIZE=20m                 # Maximum log file size

# Security Logging
ENABLE_XSS_DETECTION=true             # Enable XSS attempt logging
RATE_LIMIT_LOGGING=true               # Log rate limiting events

# Performance Monitoring
SLOW_QUERY_THRESHOLD=500              # Log queries slower than 500ms
SLOW_API_THRESHOLD=3000               # Log APIs slower than 3s
```

### File Structure

```
logs/
├── application-2024-01-15.log        # General application logs
├── error-2024-01-15.log              # Error-only logs
├── application-2024-01-14.log.gz     # Compressed older logs
└── error-2024-01-14.log.gz
```

### Log Format

All logs follow a consistent JSON structure:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User login successful",
  "category": "security",
  "event": "login_success",
  "service": "master-ai-saas",
  "environment": "production",
  "version": "1.0.0",
  "requestId": "req_1642248600000_abc123",
  "userId": "user_123",
  "userEmail": "user@example.com",
  "userRole": "USER",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "endpoint": "/api/auth/signin",
  "duration": 150,
  "metadata": {
    "additional": "context"
  }
}
```

## Admin Dashboard

Access comprehensive logging statistics and controls via:

- **GET** `/api/admin/logging?action=stats` - System statistics
- **GET** `/api/admin/logging?action=config` - Configuration validation  
- **GET** `/api/admin/logging?action=test` - Run logging system tests
- **GET** `/api/admin/logging?action=performance` - Performance metrics
- **GET** `/api/admin/logging?action=query-stats` - Database query statistics

## Monitoring and Alerts

### Performance Thresholds
- API responses > 3000ms logged as warnings
- Database queries > 500ms logged with details
- Memory usage and system resources tracked

### Security Monitoring
- Failed login attempts tracked by IP
- XSS attempts logged with full context
- Unauthorized access attempts recorded
- Rate limiting violations tracked

### Error Tracking
- All errors include full stack traces
- Request correlation for debugging
- Critical errors stored in database
- Automatic categorization and filtering

## Integration with External Services

### Sentry (Optional)
- Automatic error reporting in production
- Performance monitoring integration
- Release tracking and context

### PostHog (Optional)  
- User behavior analytics
- Feature usage tracking
- A/B testing support

## Best Practices

1. **Use Structured Logging**: Always use the provided logger categories instead of console.log
2. **Include Context**: Add relevant metadata to log entries
3. **Sanitize Data**: Never log sensitive information (passwords, tokens)
4. **Use Request IDs**: Always include request correlation IDs
5. **Performance Aware**: Logging overhead is minimized but still measurable
6. **Monitor Logs**: Set up alerts for critical error patterns
7. **Regular Cleanup**: Log rotation and retention policies are automated

## Troubleshooting

### Common Issues

1. **Logs Not Appearing**
   - Check LOG_LEVEL environment variable
   - Verify file permissions for logs directory
   - Confirm Winston transports are configured

2. **Performance Impact**
   - Logging adds 1-5ms per request
   - File I/O may impact high-traffic scenarios
   - Consider adjusting log levels in production

3. **Circular Dependencies**
   - Some modules use dynamic imports to avoid circular deps
   - Import order matters for initialization

4. **Missing Request Context**
   - Ensure API routes use withApiLogging wrapper
   - Check middleware order in application stack

## Development vs Production

### Development
- Console logging with colors
- Debug level enabled
- Immediate log output
- Full stack traces

### Production  
- JSON file logging
- Info level and above
- Log rotation enabled
- Sanitized sensitive data
- Compressed historical logs

This logging system provides comprehensive observability for the Master-AI SaaS application, enabling effective debugging, performance monitoring, security tracking, and user behavior analysis.