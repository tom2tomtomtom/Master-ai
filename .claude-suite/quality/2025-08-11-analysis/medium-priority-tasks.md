# Medium Priority Tasks

**Priority Level:** 📝 MEDIUM  
**Timeline:** 2-4 weeks  
**Impact:** Code maintainability, developer experience, optimization

## Task 1: Code Duplication Elimination

**Priority:** MEDIUM  
**Estimated Time:** 8-10 hours  
**Impact:** Maintainability, consistency, reduced bugs

### Identified Duplication Areas:

#### 1. API Route Patterns (4-5 hours)
**Current Issue:** Repetitive error handling, request validation, and response formatting across 50+ API routes.

```typescript
// Common pattern found in multiple files:
// src/app/api/lessons/[id]/route.ts
// src/app/api/achievements/route.ts
// src/app/api/dashboard/stats/route.ts

// Before (repeated in ~30 files):
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Route-specific logic here
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
```

**Solution:** Create reusable API route wrapper:
```typescript
// src/lib/api-wrapper.ts
interface ApiRouteOptions {
  requireAuth: boolean;
  requireRole?: UserRole;
  validate?: z.ZodSchema;
  rateLimit?: string;
}

export function createApiRoute<T>(
  handler: (context: ApiContext) => Promise<T>,
  options: ApiRouteOptions = { requireAuth: true }
) {
  return async function (request: Request, context: { params?: any }) {
    const requestId = generateRequestId();
    const startTime = performance.now();
    
    try {
      // Authentication
      if (options.requireAuth) {
        const session = await getServerSession(authOptions);
        if (!session) {
          return standardErrorResponse('UNAUTHORIZED', 401, requestId);
        }
      }
      
      // Role validation
      if (options.requireRole && !hasRequiredRole(session.user, options.requireRole)) {
        return standardErrorResponse('FORBIDDEN', 403, requestId);
      }
      
      // Input validation
      if (options.validate) {
        const body = await request.json();
        const validation = options.validate.safeParse(body);
        if (!validation.success) {
          return standardErrorResponse('VALIDATION_ERROR', 400, requestId, validation.error);
        }
      }
      
      // Rate limiting
      if (options.rateLimit) {
        const rateLimitResult = await checkRateLimit(options.rateLimit, request);
        if (rateLimitResult) return rateLimitResult;
      }
      
      // Execute handler
      const result = await handler({
        request,
        params: context.params,
        user: session?.user,
        requestId
      });
      
      // Log performance
      const duration = performance.now() - startTime;
      logger.info('API request completed', {
        requestId,
        duration,
        endpoint: request.url,
        method: request.method
      });
      
      return standardSuccessResponse(result, requestId);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error('API request failed', {
        requestId,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        endpoint: request.url,
        method: request.method
      });
      
      return standardErrorResponse('INTERNAL_ERROR', 500, requestId);
    }
  };
}

// Usage in API routes:
export const GET = createApiRoute(async ({ user, params }) => {
  const lessons = await prisma.lesson.findMany({
    where: { userId: user.id }
  });
  return lessons;
}, { requireAuth: true });
```

#### 2. Form Validation Logic (2-3 hours)
**Issue:** Repeated form validation patterns across components.

```typescript
// Create: src/lib/form-utils.ts
interface FormField<T> {
  name: keyof T;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea';
  validation: z.ZodSchema;
  placeholder?: string;
  required?: boolean;
}

export function useFormWithValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  onSubmit: (data: T) => Promise<void>
) {
  const [data, setData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const validated = schema.parse(data);
      await onSubmit(validated);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof T] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { data, setData, errors, isSubmitting, handleSubmit };
}
```

#### 3. Database Query Patterns (2-3 hours)
**Issue:** Repeated query patterns with similar structures.

```typescript
// Create: src/lib/query-builders.ts
export class QueryBuilder<T> {
  private model: any;
  private includes: Record<string, boolean> = {};
  private filters: Record<string, any> = {};
  private sorting: { field: string; direction: 'asc' | 'desc' }[] = [];
  
  constructor(model: any) {
    this.model = model;
  }
  
  include(relation: string): this {
    this.includes[relation] = true;
    return this;
  }
  
  where(field: string, value: any): this {
    this.filters[field] = value;
    return this;
  }
  
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.sorting.push({ field, direction });
    return this;
  }
  
  async execute(): Promise<T[]> {
    const query: any = {
      where: this.filters,
    };
    
    if (Object.keys(this.includes).length > 0) {
      query.include = this.includes;
    }
    
    if (this.sorting.length > 0) {
      query.orderBy = this.sorting.map(sort => ({
        [sort.field]: sort.direction
      }));
    }
    
    return await this.model.findMany(query);
  }
}

// Usage:
const lessons = await new QueryBuilder(prisma.lesson)
  .where('published', true)
  .include('author')
  .include('learningPaths')
  .orderBy('createdAt', 'desc')
  .execute();
```

### Files to Refactor:
- All API routes in `src/app/api/**/*.ts`
- Form components in `src/components/auth/` and `src/components/profile/`
- Database queries in service layers

### Acceptance Criteria:
- [ ] API route boilerplate reduced by 70%
- [ ] Form validation logic centralized and reusable
- [ ] Database queries use consistent patterns
- [ ] Code duplication reduced by 50%

---

## Task 2: Testing Infrastructure Enhancement

**Priority:** MEDIUM  
**Estimated Time:** 10-12 hours  
**Impact:** Code reliability, regression prevention, development confidence

### Current Testing Gaps:

#### 1. API Route Testing (4-5 hours)
**Issue:** Limited integration testing for API endpoints.

```typescript
// Create: src/__tests__/api/api-test-utils.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock authenticated requests
export function createMockRequest(
  method: string,
  url: string,
  body?: any,
  session?: any
) {
  const request = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'content-type': 'application/json',
    },
  });
  
  // Mock session
  if (session) {
    jest.mocked(getServerSession).mockResolvedValue(session);
  }
  
  return request;
}

// Test API routes
export async function testApiRoute(
  handler: Function,
  options: {
    method: string;
    url: string;
    body?: any;
    session?: any;
    expectedStatus: number;
    expectedData?: any;
  }
) {
  const request = createMockRequest(
    options.method,
    options.url,
    options.body,
    options.session
  );
  
  const response = await handler(request);
  const data = await response.json();
  
  expect(response.status).toBe(options.expectedStatus);
  
  if (options.expectedData) {
    expect(data).toMatchObject(options.expectedData);
  }
  
  return { response, data };
}

// Example usage:
describe('/api/lessons/[id]', () => {
  it('should return lesson data for authenticated user', async () => {
    await testApiRoute(GET, {
      method: 'GET',
      url: '/api/lessons/lesson-1',
      session: { user: { id: 'user-1', role: 'USER' } },
      expectedStatus: 200,
      expectedData: { success: true }
    });
  });
});
```

#### 2. Component Integration Testing (3-4 hours)
**Issue:** Limited testing of component interactions and user flows.

```typescript
// Create: src/__tests__/components/component-test-utils.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from 'next-auth/react';

export function renderWithProviders(
  component: React.ReactElement,
  options: {
    session?: any;
    router?: any;
  } = {}
) {
  const { session, router } = options;
  
  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    );
  };
  
  return {
    user: userEvent.setup(),
    ...render(component, { wrapper: AllProviders })
  };
}

// User flow testing helper
export async function performUserFlow(
  steps: Array<{
    action: 'click' | 'type' | 'wait';
    target?: string;
    text?: string;
    waitFor?: string;
  }>
) {
  const user = userEvent.setup();
  
  for (const step of steps) {
    switch (step.action) {
      case 'click':
        await user.click(screen.getByRole(step.target!));
        break;
      case 'type':
        await user.type(screen.getByRole(step.target!), step.text!);
        break;
      case 'wait':
        await waitFor(() => screen.getByText(step.waitFor!));
        break;
    }
  }
}
```

#### 3. Database Testing (2-3 hours)
**Issue:** Database operations not covered by tests.

```typescript
// Create: src/__tests__/database/db-test-utils.ts
import { prisma } from '@/lib/prisma';

export async function createTestUser(data: Partial<any> = {}) {
  return await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      ...data
    }
  });
}

export async function createTestLesson(data: Partial<any> = {}) {
  return await prisma.lesson.create({
    data: {
      title: 'Test Lesson',
      content: 'Test content',
      published: true,
      ...data
    }
  });
}

export async function cleanupTestData() {
  // Clean up test data in reverse order of dependencies
  await prisma.lessonProgress.deleteMany({
    where: { user: { email: { contains: 'test' } } }
  });
  await prisma.user.deleteMany({
    where: { email: { contains: 'test' } }
  });
}

// Database transaction testing
export async function testDatabaseTransaction(
  operation: () => Promise<void>,
  expectedChanges: {
    model: string;
    count: number;
  }[]
) {
  const initialCounts = await Promise.all(
    expectedChanges.map(async ({ model }) => ({
      model,
      count: await (prisma as any)[model].count()
    }))
  );
  
  await operation();
  
  const finalCounts = await Promise.all(
    expectedChanges.map(async ({ model }) => ({
      model,
      count: await (prisma as any)[model].count()
    }))
  );
  
  expectedChanges.forEach(({ model, count }, index) => {
    const initial = initialCounts[index].count;
    const final = finalCounts[index].count;
    expect(final - initial).toBe(count);
  });
}
```

### Test Coverage Goals:
- **API Routes:** 85% coverage
- **Components:** 80% coverage
- **Database Operations:** 90% coverage
- **User Flows:** 70% coverage

### Acceptance Criteria:
- [ ] All API routes have integration tests
- [ ] Critical user flows tested end-to-end
- [ ] Database operations covered by tests
- [ ] CI/CD pipeline includes test gates

---

## Task 3: Documentation and Developer Experience

**Priority:** MEDIUM  
**Estimated Time:** 6-8 hours  
**Impact:** Developer onboarding, maintenance efficiency

### Documentation Improvements:

#### 1. API Documentation (3-4 hours)
```typescript
// Auto-generate API documentation
// Create: scripts/generate-api-docs.ts
import fs from 'fs';
import path from 'path';
import glob from 'glob';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: Parameter[];
  responses: Response[];
  authentication: boolean;
}

export function generateApiDocs() {
  const apiFiles = glob.sync('src/app/api/**/route.ts');
  const endpoints: ApiEndpoint[] = [];
  
  apiFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const endpoint = parseApiFile(content, file);
    if (endpoint) endpoints.push(endpoint);
  });
  
  const documentation = generateMarkdown(endpoints);
  fs.writeFileSync('docs/api.md', documentation);
}

function parseApiFile(content: string, filePath: string): ApiEndpoint | null {
  // Parse JSDoc comments and function signatures
  // Extract endpoint information
  return null; // Implementation needed
}
```

#### 2. Component Documentation (2-3 hours)
```typescript
// Create Storybook stories for components
// src/components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};
```

#### 3. Development Setup Guide (1-2 hours)
```markdown
# docs/development-setup.md

## Development Environment Setup

### Prerequisites
- Node.js 22.x
- PostgreSQL 14+
- Redis (optional, for caching)

### Quick Start
```bash
# Clone repository
git clone [repository-url]
cd master-ai-saas

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
npm run db:migrate
npm run setup

# Start development server
npm run dev
```

### Environment Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| DATABASE_URL | PostgreSQL connection string | Yes | - |
| NEXTAUTH_SECRET | Authentication secret | Yes | - |
| REDIS_URL | Redis connection string | No | - |

### Available Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run test` | Run test suite |
| `npm run lint` | Run linting |

### Project Structure
```
src/
├── app/                 # Next.js app router
├── components/          # React components
├── lib/                 # Utility libraries
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```
```

### Acceptance Criteria:
- [ ] API endpoints documented with examples
- [ ] UI components have Storybook stories
- [ ] Development setup guide complete
- [ ] Architecture decisions documented

---

## Task 4: User Experience Enhancements

**Priority:** MEDIUM  
**Estimated Time:** 8-10 hours  
**Impact:** User satisfaction, engagement

### UX Improvement Areas:

#### 1. Loading States and Skeletons (3-4 hours)
```typescript
// Create: src/components/ui/skeleton.tsx
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  className, 
  variant = 'text', 
  width, 
  height, 
  lines = 1 
}: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-muted rounded h-4 mb-2"
            style={{ 
              width: i === lines - 1 ? '60%' : '100%' 
            }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        "animate-pulse bg-muted rounded",
        variant === 'circular' && "rounded-full",
        className
      )}
      style={{ width, height }}
    />
  );
}

// Usage in components:
export function LessonCardSkeleton() {
  return (
    <div className="border rounded-lg p-6">
      <Skeleton variant="rectangular" width="100%" height="200px" className="mb-4" />
      <Skeleton variant="text" lines={2} className="mb-2" />
      <Skeleton variant="text" width="60%" />
    </div>
  );
}
```

#### 2. Progressive Data Loading (2-3 hours)
```typescript
// Implement incremental loading for large datasets
// src/hooks/use-infinite-lessons.ts
export function useInfiniteLessons(filters: LessonFilters) {
  return useInfiniteQuery({
    queryKey: ['lessons', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/lessons?page=${pageParam}&${new URLSearchParams(filters)}`);
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Component usage:
export function LessonList({ filters }: { filters: LessonFilters }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteLessons(filters);

  if (status === 'loading') {
    return <LessonListSkeleton />;
  }

  return (
    <div>
      {data?.pages.map((group, i) => (
        <React.Fragment key={i}>
          {group.lessons.map((lesson: Lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </React.Fragment>
      ))}
      
      <InfiniteScrollTrigger
        onIntersect={fetchNextPage}
        hasMore={hasNextPage}
        loading={isFetchingNextPage}
      />
    </div>
  );
}
```

#### 3. Accessibility Improvements (2-3 hours)
```typescript
// Create: src/components/accessibility/focus-trap.tsx
export function FocusTrap({ children, active }: { children: React.ReactNode; active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!active || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [active]);
  
  return (
    <div ref={containerRef} role="dialog" aria-modal={active}>
      {children}
    </div>
  );
}

// Screen reader announcements
export function useAnnouncement() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);
  
  return { announce };
}
```

### Acceptance Criteria:
- [ ] All loading states have skeleton components
- [ ] Large datasets load progressively
- [ ] WCAG 2.1 AA compliance achieved
- [ ] Screen reader support implemented

---

## Progress Tracking

### Success Metrics:
- **Code Duplication:** Reduced by 50%
- **Test Coverage:** 80%+ across critical paths
- **Documentation:** Complete API and component docs
- **User Experience:** Improved loading states and accessibility

### Timeline:
- **Week 1:** Code duplication elimination + Testing infrastructure
- **Week 2:** Documentation + UX enhancements

---

**Previous:** [High Priority Tasks](./high-priority-tasks.md) | **Next:** [Low Priority Tasks](./low-priority-tasks.md)