# Master-AI SaaS Testing Suite

Comprehensive testing strategy for validating the Master-AI platform with 89 lessons, 8 learning paths, and multi-tier subscription system.

## Overview

This testing suite ensures platform readiness for user testing by validating all critical user flows, API endpoints, subscription gating, and performance under realistic load conditions.

### Test Coverage

- **Authentication Flows**: Complete user registration, login, and password reset
- **Content Access**: Premium vs free content validation with subscription gating
- **Learning Management**: Progress tracking, bookmarks, and notes across 89 lessons
- **Dashboard Functionality**: Statistics, learning paths, and user experience
- **API Integration**: All endpoints with real database integration
- **Performance**: Lesson loading and dashboard rendering benchmarks
- **End-to-End**: Complete user journey simulations

## Quick Start

### Run All Tests
```bash
npm run test:full
```

### Run Only Critical Tests
```bash
npm run test:critical
```

### Run Specific Test Categories
```bash
npm run test:auth          # Authentication tests
npm run test:api           # API integration tests
npm run test:components    # Component tests
npm run test:e2e          # End-to-end tests
npm run test:performance  # Performance benchmarks
```

### Continuous Integration
```bash
npm run test:ci           # Critical tests + coverage report
```

## Test Structure

```
src/__tests__/
├── setup/                 # Test infrastructure
│   ├── test-db.ts         # Database setup with real schema
│   ├── test-factories.ts  # Data factories for realistic test data
│   └── test-utils.ts      # Testing utilities and helpers
├── auth/                  # Authentication flow tests
│   ├── signup.test.ts     # User registration
│   ├── signin.test.ts     # Login flows
│   └── password-reset.test.ts
├── api/                   # API integration tests
│   ├── lessons.test.ts    # Lesson endpoints
│   ├── dashboard.test.ts  # Dashboard API
│   └── subscription-access.test.ts
├── components/            # Component tests
│   ├── lesson/           # Lesson viewer components
│   ├── dashboard/        # Dashboard components
│   └── subscription/     # Subscription gating
├── e2e/                  # End-to-end integration
│   └── complete-user-journey.test.ts
├── performance/          # Performance benchmarks
│   ├── lesson-loading.test.ts
│   └── dashboard-rendering.test.ts
└── test-runner.ts        # Comprehensive test orchestration
```

## Critical Test Areas

### 1. User Authentication

**Tests**: `src/__tests__/auth/`

Validates complete authentication flows:

- ✅ User registration with email verification
- ✅ Login with credentials and OAuth providers
- ✅ Password reset with secure token validation
- ✅ Session management and security
- ✅ Input validation and error handling

**Example Usage**:
```bash
npm run test:auth
```

### 2. Lesson Content Access

**Tests**: `src/__tests__/components/lesson/` & `src/__tests__/api/lessons.test.ts`

Tests lesson content delivery and access control:

- ✅ Content rendering with markdown parsing
- ✅ Video player integration
- ✅ Progress tracking and auto-save
- ✅ Navigation between 89 lessons
- ✅ Premium vs free content gating
- ✅ Subscription tier validation

**Key Features Tested**:
- Lesson viewer with real content
- Progress persistence across sessions
- Subscription-based access control
- Interactive features (bookmarks, notes)

### 3. Subscription Gating

**Tests**: `src/__tests__/components/subscription/` & `src/__tests__/api/subscription-access.test.ts`

Comprehensive subscription tier validation:

- ✅ Free tier limitations
- ✅ Pro tier premium access
- ✅ Team tier collaborative features
- ✅ Enterprise tier full access
- ✅ Trial period handling
- ✅ Subscription expiration logic

**Subscription Matrix**:
```
Content Type    | Free | Pro | Team | Enterprise
----------------|------|-----|------|------------
Free Lessons    |  ✅  |  ✅  |  ✅   |     ✅
Premium Lessons |  ❌  |  ✅  |  ✅   |     ✅
Team Features   |  ❌  |  ❌  |  ✅   |     ✅
Enterprise Only |  ❌  |  ❌  |  ❌   |     ✅
```

### 4. Dashboard & Analytics

**Tests**: `src/__tests__/components/dashboard/` & `src/__tests__/api/dashboard.test.ts`

Tests user dashboard with realistic data:

- ✅ Learning statistics calculation
- ✅ Progress visualization
- ✅ Recent activity tracking
- ✅ Achievement system
- ✅ Learning path management
- ✅ Performance with large datasets

### 5. API Integration

**Tests**: `src/__tests__/api/`

Tests all API endpoints with database integration:

- ✅ Lesson CRUD operations
- ✅ User progress management
- ✅ Dashboard data aggregation
- ✅ Authentication middleware
- ✅ Error handling and validation
- ✅ Performance under load

### 6. End-to-End User Flows

**Tests**: `src/__tests__/e2e/complete-user-journey.test.ts`

Simulates complete user experiences:

- ✅ New user onboarding
- ✅ Premium user learning journey
- ✅ Multi-user concurrent access
- ✅ Data integrity maintenance
- ✅ Performance at scale

**User Journey Coverage**:
1. Account creation and verification
2. Learning path selection
3. Lesson progression with notes/bookmarks
4. Achievement unlocking
5. Subscription upgrade flow
6. Dashboard usage patterns

## Performance Benchmarks

**Tests**: `src/__tests__/performance/`

### Lesson Loading Performance
- Single lesson: < 200ms
- Large content (200KB): < 500ms  
- Navigation queries: < 100ms
- Bulk loading (20 items): < 300ms
- Search queries: < 200ms

### Dashboard Rendering Performance
- Minimal data: < 100ms
- Large datasets (89 lessons): < 300ms
- Concurrent users: < 800ms
- Memory usage: < 50MB increase
- Virtual scrolling: < 10ms per scroll

### Database Performance
- Setup time: < 5 seconds
- Complex queries: < 1 second
- Concurrent operations: Maintained performance
- Memory management: No leaks detected

## Test Data Management

### Realistic Test Data

The test suite uses factories to generate realistic data:

```typescript
// 89 lessons with varied content
await createTestLesson(prisma, {
  content: generateLargeMarkdownContent(50000), // ~50KB
  videoUrl: 'https://example.com/video.mp4',
  tools: ['ChatGPT', 'Claude', 'Gemini'],
  isFree: index < 20, // First 20 are free
});

// 8 learning paths with proper progression
await createLearningPathWithLessons(prisma, 12);

// Users with different subscription tiers
await createSubscribedUser(prisma, 'pro');
```

### Database Testing

- **Isolation**: Each test uses fresh database state
- **Real Schema**: Tests against actual Prisma schema
- **Performance**: Benchmarks with realistic data volumes
- **Constraints**: Validates database integrity rules

## Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
}
```

### Environment Variables

Required for testing:
```env
NEXTAUTH_SECRET=test-secret
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://test:test@localhost:5432/test
NODE_ENV=test
```

## CI/CD Integration

### Pre-deployment Checklist

1. **Critical Tests Pass**: All authentication and core functionality
2. **API Integration**: All endpoints respond correctly
3. **Subscription Logic**: Premium gating works correctly
4. **Performance Benchmarks**: Meet specified thresholds
5. **Database Integrity**: Constraints and relationships valid

### GitHub Actions Integration

```yaml
- name: Run Critical Tests
  run: npm run test:critical

- name: Run Full Test Suite
  run: npm run test:full

- name: Generate Coverage Report
  run: npm run test:coverage
```

### Deployment Gates

- **Staging**: Critical tests must pass
- **Production**: Full test suite + performance benchmarks
- **Rollback**: Automated if critical tests fail post-deployment

## Troubleshooting

### Common Issues

**Database Connection Failures**
```bash
# Ensure PostgreSQL is running
brew services start postgresql

# Check connection string
echo $DATABASE_URL
```

**Memory Issues in Tests**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Run with garbage collection
node --expose-gc ./node_modules/.bin/jest
```

**Timeout Issues**
```bash
# Increase test timeout for slow operations
jest --testTimeout=30000
```

### Performance Debugging

**Slow Test Identification**
```bash
# Run with timing information
npm run test:performance -- --verbose

# Profile specific test
node --prof ./node_modules/.bin/jest specific-test.test.ts
```

**Memory Profiling**
```bash
# Check for memory leaks
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## Contributing

### Adding New Tests

1. **Choose Appropriate Category**: Place in correct test directory
2. **Use Test Factories**: Generate realistic data with factories
3. **Follow Naming Convention**: `feature.test.ts` or `component-name.test.tsx`
4. **Include Performance Tests**: For user-facing features
5. **Update Documentation**: Add to this README

### Test Writing Guidelines

- **Arrange-Act-Assert**: Clear test structure
- **Descriptive Names**: Tests should read like specifications
- **Independent Tests**: No test dependencies
- **Realistic Data**: Use factories for data generation
- **Performance Aware**: Include timing assertions for critical paths

### Code Coverage Goals

- **Critical Paths**: 90%+ coverage
- **API Endpoints**: 85%+ coverage
- **Components**: 75%+ coverage
- **Utilities**: 80%+ coverage

## Monitoring and Reporting

### Test Reports

The test runner generates comprehensive reports:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "summary": {
    "total": 8,
    "passed": 7,
    "failed": 1,
    "duration": 125.5
  },
  "platformStatus": "READY",
  "coverage": {
    "lessons": 89,
    "learningPaths": 8,
    "subscriptionTiers": ["free", "pro", "team", "enterprise"]
  }
}
```

### Metrics Tracking

- **Test Execution Time**: Monitor for performance regressions
- **Failure Rates**: Track by test category
- **Coverage Trends**: Ensure coverage maintains quality
- **Performance Benchmarks**: Alert on threshold breaches

## Support

For testing issues or questions:

1. **Check Documentation**: Review this testing guide
2. **Run Diagnostics**: Use `npm run test:full --verbose`
3. **Check Logs**: Examine test output for specific errors
4. **Performance Issues**: Run `npm run test:performance`

---

**Platform Status**: This testing suite validates the Master-AI SaaS platform is ready for user testing with confidence in all critical functionality, subscription handling, and performance under realistic conditions with 89 lessons and 8 learning paths.