# TODO Features Implementation Specification

**Status:** Ready for Implementation
**Priority:** Medium
**Estimated Effort:** 4-6 hours
**Created:** 2025-10-11
**Last Updated:** 2025-10-11

---

## Executive Summary

This specification covers the implementation of three TODO features identified during code quality improvements:

1. **User Subscription Tier Retrieval** - Display actual user subscription data in UI
2. **Completion Rate Calculation** - Calculate real-time lesson completion rates
3. **Permission Checking System** - Database-backed role/permission verification

These features complete the subscription and progress tracking functionality, transitioning from hardcoded placeholder values to dynamic, database-driven data.

---

## Table of Contents

1. [Feature 1: User Subscription Tier Retrieval](#feature-1-user-subscription-tier-retrieval)
2. [Feature 2: Completion Rate Calculation](#feature-2-completion-rate-calculation)
3. [Feature 3: Permission Checking System](#feature-3-permission-checking-system)
4. [Technical Architecture](#technical-architecture)
5. [Implementation Plan](#implementation-plan)
6. [Testing Strategy](#testing-strategy)
7. [Rollout Plan](#rollout-plan)

---

## Feature 1: User Subscription Tier Retrieval

### Current State

**Locations with TODOs:**
- `src/app/auth/welcome/page.tsx:73` - Hardcoded `subscriptionTier = 'free'`
- `src/components/auth/subscription-gate.tsx:78` - Hardcoded `userTier = 'free'`
- `src/components/auth/subscription-gate.tsx:154` - Duplicate hardcoded value

**Current Implementation:**
```typescript
// Welcome page - line 73
const subscriptionTier = 'free'; // TODO: Get from user data

// Subscription gate - line 78
const userTier = 'free'; // TODO: Get from user subscription data
```

### Desired State

**Dynamic Subscription Retrieval:**
```typescript
// Welcome page - fetches from API
const [subscriptionData, setSubscriptionData] = useState<{
  tier: string;
  status: string;
  endsAt: Date | null;
  trialEndsAt: Date | null;
} | null>(null);

// Subscription gate - uses auth context
const { user } = useAuth();
const userTier = user?.subscriptionTier || 'free';
```

### Database Schema

**Already Implemented in Prisma:**
```prisma
model User {
  subscriptionTier       String    @default("free") // free, pro, team, enterprise
  subscriptionStatus     String    @default("active") // active, canceled, past_due, incomplete, trialing
  stripeCustomerId       String?   @unique
  stripeSubscriptionId   String?   @unique
  subscriptionEndsAt     DateTime?
  trialEndsAt            DateTime?
  billingInterval        String?   // month, year
}
```

### Implementation Requirements

#### 1.1 Update NextAuth Session Type

**File:** `src/lib/auth.ts` or `src/types/next-auth.d.ts`

Add subscription fields to session:
```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
      subscriptionTier: string;      // Add
      subscriptionStatus: string;    // Add
      subscriptionEndsAt?: Date;     // Add
      trialEndsAt?: Date;            // Add
    }
  }
}
```

#### 1.2 Update Auth Callbacks

**File:** `src/lib/auth.ts`

Modify JWT and session callbacks to include subscription data:
```typescript
callbacks: {
  async jwt({ token, user, trigger, session }) {
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.subscriptionTier = user.subscriptionTier;
      token.subscriptionStatus = user.subscriptionStatus;
      token.subscriptionEndsAt = user.subscriptionEndsAt;
      token.trialEndsAt = user.trialEndsAt;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.subscriptionTier = token.subscriptionTier;
      session.user.subscriptionStatus = token.subscriptionStatus;
      session.user.subscriptionEndsAt = token.subscriptionEndsAt;
      session.user.trialEndsAt = token.trialEndsAt;
    }
    return session;
  }
}
```

#### 1.3 Update Welcome Page

**File:** `src/app/auth/welcome/page.tsx`

Replace hardcoded value with auth session data:
```typescript
import { useAuth } from '@/components/providers/safe-auth-provider';

export default function WelcomePage() {
  const { user } = useAuth();
  const subscriptionTier = user?.subscriptionTier || 'free';

  // Use real subscription data for UI personalization
  const showProFeatures = ['pro', 'team', 'enterprise'].includes(subscriptionTier);

  return (
    <div>
      {/* Conditionally render based on actual subscription tier */}
      {showProFeatures && <ProFeatureHighlight />}
    </div>
  );
}
```

#### 1.4 Update Subscription Gate

**File:** `src/components/auth/subscription-gate.tsx`

Replace hardcoded values with session data:
```typescript
export function SubscriptionGate({
  children,
  requiredTier,
  fallback,
  redirectTo = '/pricing'
}: SubscriptionGateProps) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  // Use actual subscription tier from session
  const userTier = user.subscriptionTier || 'free';
  const userStatus = user.subscriptionStatus || 'active';
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy];
  const requiredTierLevel = tierHierarchy[requiredTier];

  // Check if subscription is active
  const hasActiveSubscription = ['active', 'trialing'].includes(userStatus);

  if (!hasActiveSubscription || userTierLevel < requiredTierLevel) {
    return fallback || <UpgradePrompt requiredTier={requiredTier} />;
  }

  return <>{children}</>;
}
```

#### 1.5 Create Subscription API Endpoint

**New File:** `src/app/api/user/subscription/route.ts`

Already exists - verify it returns all necessary fields:
```typescript
export async function GET(request: NextRequest) {
  const user = await requireAuth();

  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      trialEndsAt: true,
      billingInterval: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    }
  });

  return NextResponse.json({
    tier: userData?.subscriptionTier || 'free',
    status: userData?.subscriptionStatus || 'active',
    endsAt: userData?.subscriptionEndsAt,
    trialEndsAt: userData?.trialEndsAt,
    billingInterval: userData?.billingInterval,
    hasStripeSubscription: !!userData?.stripeSubscriptionId,
  });
}
```

### Acceptance Criteria

- [ ] Welcome page displays actual user subscription tier
- [ ] Subscription gate correctly checks user tier from session
- [ ] All three locations (welcome + 2x subscription gate) use dynamic data
- [ ] Session includes subscription fields after authentication
- [ ] Subscription data updates in real-time after changes
- [ ] Free users see appropriate messaging
- [ ] Pro/Team/Enterprise users see appropriate features
- [ ] Expired subscriptions are handled gracefully

---

## Feature 2: Completion Rate Calculation

### Current State

**Locations with TODOs:**
- `src/app/api/lessons/recommendations/route.ts:185` - Hardcoded `completionRate: 75`
- `src/app/api/lessons/search/route.ts:148` - Hardcoded `completionRate: 75`

**Current Implementation:**
```typescript
// Both locations return static value
lessons.map(lesson => ({
  ...lesson,
  completionRate: 75, // TODO: Calculate actual completion rate
}))
```

### Desired State

**Dynamic Completion Rate Calculation:**
```typescript
// Calculate completion rate from UserProgress data
const completionRate = calculateCompletionRate(lesson.id, userId);

// Or aggregate at query time
lessons.map(lesson => ({
  ...lesson,
  completionRate: lesson._count.completedProgress / lesson._count.totalProgress * 100,
}))
```

### Database Schema

**Already Available:**
```prisma
model UserProgress {
  id                   String   @id @default(cuid())
  userId               String
  lessonId             String
  status               String   // not_started, in_progress, completed
  progressPercentage   Int      @default(0)
  completedAt          DateTime?
  lastAccessed         DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
}
```

### Implementation Requirements

#### 2.1 Create Completion Rate Utility

**New File:** `src/lib/analytics/completion-rate.ts`

```typescript
import { PrismaClient } from '@prisma/client';

/**
 * Calculate completion rate for a specific lesson
 *
 * Completion rate = (Number of users who completed / Total users who started) * 100
 */
export async function calculateLessonCompletionRate(
  prisma: PrismaClient,
  lessonId: string
): Promise<number> {
  // Get all users who have progress on this lesson
  const progressRecords = await prisma.userProgress.findMany({
    where: { lessonId },
    select: { status: true }
  });

  if (progressRecords.length === 0) return 0;

  const completedCount = progressRecords.filter(p => p.status === 'completed').length;
  const completionRate = (completedCount / progressRecords.length) * 100;

  return Math.round(completionRate);
}

/**
 * Calculate completion rates for multiple lessons efficiently
 *
 * Returns a Map of lessonId -> completionRate
 */
export async function calculateBulkCompletionRates(
  prisma: PrismaClient,
  lessonIds: string[]
): Promise<Map<string, number>> {
  const results = await prisma.userProgress.groupBy({
    by: ['lessonId', 'status'],
    where: {
      lessonId: { in: lessonIds }
    },
    _count: true
  });

  const ratesMap = new Map<string, number>();
  const lessonStats = new Map<string, { total: number; completed: number }>();

  // Aggregate counts per lesson
  results.forEach(result => {
    const stats = lessonStats.get(result.lessonId) || { total: 0, completed: 0 };
    stats.total += result._count;
    if (result.status === 'completed') {
      stats.completed += result._count;
    }
    lessonStats.set(result.lessonId, stats);
  });

  // Calculate rates
  lessonStats.forEach((stats, lessonId) => {
    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    ratesMap.set(lessonId, rate);
  });

  return ratesMap;
}

/**
 * Calculate average completion rate across all lessons
 */
export async function calculateOverallCompletionRate(
  prisma: PrismaClient
): Promise<number> {
  const allProgress = await prisma.userProgress.count();
  const completedProgress = await prisma.userProgress.count({
    where: { status: 'completed' }
  });

  if (allProgress === 0) return 0;
  return Math.round((completedProgress / allProgress) * 100);
}

/**
 * Calculate user-specific completion rate
 * (What percentage of lessons this user has completed)
 */
export async function calculateUserCompletionRate(
  prisma: PrismaClient,
  userId: string
): Promise<number> {
  const totalLessons = await prisma.lesson.count({ where: { isPublished: true } });
  const completedLessons = await prisma.userProgress.count({
    where: {
      userId,
      status: 'completed'
    }
  });

  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}
```

#### 2.2 Update Recommendations Route

**File:** `src/app/api/lessons/recommendations/route.ts`

Replace hardcoded value with calculation:
```typescript
import { calculateBulkCompletionRates } from '@/lib/analytics/completion-rate';

// Inside GET handler, after fetching lessons
const lessonIds = allLessons.map(l => l.id);
const completionRates = await calculateBulkCompletionRates(prisma, lessonIds);

// Map lessons with real completion rates
const lessonsWithMetadata = allLessons.map(lesson => {
  const progress = lesson.progress[0];

  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    difficulty: lesson.difficulty,
    estimatedMinutes: lesson.estimatedMinutes,
    thumbnailUrl: lesson.thumbnailUrl,
    isPremium: lesson.isPremium,
    isPublished: lesson.isPublished,
    orderIndex: lesson.orderIndex,
    createdAt: lesson.createdAt,
    categories: lesson.categories.map(c => c.category),
    isBookmarked: lesson.bookmarks.length > 0,
    progress: progress ? {
      status: progress.status,
      progressPercentage: progress.progressPercentage,
      completedAt: progress.completedAt,
      lastAccessed: progress.lastAccessed,
    } : null,
    interactionCount: lesson._count.interactions,
    completionRate: completionRates.get(lesson.id) || 0, // Real calculation
  };
});
```

#### 2.3 Update Search Route

**File:** `src/app/api/lessons/search/route.ts`

Same pattern as recommendations:
```typescript
import { calculateBulkCompletionRates } from '@/lib/analytics/completion-rate';

// After fetching lessons
const lessonIds = lessons.map(l => l.id);
const completionRates = await calculateBulkCompletionRates(prisma, lessonIds);

// Map with real rates
const formattedLessons = lessons.map(lesson => ({
  // ... other fields
  completionRate: completionRates.get(lesson.id) || 0, // Real calculation
}));
```

#### 2.4 Add Caching for Performance

**File:** `src/lib/analytics/completion-rate.ts`

Add Redis caching to avoid recalculating frequently:
```typescript
import { cache } from '@/utils/cache/redisClient';

const CACHE_TTL = 3600; // 1 hour

export async function calculateLessonCompletionRate(
  prisma: PrismaClient,
  lessonId: string
): Promise<number> {
  // Check cache first
  const cacheKey = `completion_rate:${lessonId}`;
  const cached = await cache.get<number>(cacheKey);
  if (cached !== null) return cached;

  // Calculate if not cached
  const progressRecords = await prisma.userProgress.findMany({
    where: { lessonId },
    select: { status: true }
  });

  if (progressRecords.length === 0) return 0;

  const completedCount = progressRecords.filter(p => p.status === 'completed').length;
  const completionRate = Math.round((completedCount / progressRecords.length) * 100);

  // Cache result
  await cache.set(cacheKey, completionRate, CACHE_TTL);

  return completionRate;
}
```

#### 2.5 Invalidate Cache on Progress Update

**File:** `src/app/api/lessons/[id]/progress/route.ts`

Clear cache when user completes lesson:
```typescript
import { cache } from '@/utils/cache/redisClient';

// After updating progress
if (status === 'completed') {
  // Invalidate completion rate cache
  await cache.del(`completion_rate:${lessonId}`);
}
```

### Acceptance Criteria

- [ ] Recommendations route shows real completion rates
- [ ] Search route shows real completion rates
- [ ] Completion rates update when users complete lessons
- [ ] Rates are cached for performance (1 hour TTL)
- [ ] Cache invalidates when progress updates
- [ ] Edge cases handled (no progress data, new lessons)
- [ ] Bulk calculation is performant (<100ms for 50 lessons)
- [ ] Rates display correctly in lesson cards/UI

---

## Feature 3: Permission Checking System

### Current State

**Location with TODO:**
- `src/lib/auth-helpers.ts:120` - Empty permission check implementation

**Current Implementation:**
```typescript
export async function requirePermission(
  permission: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  // Admin bypass
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return user;
  }

  // TODO: Implement permission checking against database
  // For now, reject all non-admin permission checks
  throw new AuthError(
    AuthErrorCode.INSUFFICIENT_PERMISSIONS,
    `Permission required: ${permission}`,
    403
  );
}
```

### Desired State

**Database-Backed RBAC System:**
```typescript
// Check specific permissions
const user = await requirePermission('lessons:delete');

// Check multiple permissions
const user = await requirePermissions(['lessons:edit', 'lessons:publish']);

// Check role-based access
const user = await requireRole(['ADMIN', 'SUPER_ADMIN']);
```

### Database Schema

**New Tables Needed:**
```prisma
// Permission definitions
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique // e.g., "lessons:create", "users:delete"
  description String?
  category    String   // e.g., "lessons", "users", "admin"
  createdAt   DateTime @default(now())

  roles       RolePermission[]

  @@map("permissions")
}

// Role-Permission mapping (many-to-many)
model RolePermission {
  id           String     @id @default(cuid())
  role         UserRole
  permissionId String
  createdAt    DateTime   @default(now())

  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([role, permissionId])
  @@map("role_permissions")
}
```

### Implementation Requirements

#### 3.1 Create Permission Migration

**New File:** `prisma/migrations/YYYYMMDDHHMMSS_add_permissions/migration.sql`

```sql
-- Create permissions table
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- Create role_permissions junction table
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "user_roles" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");
CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON "role_permissions"("role", "permissionId");
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- Foreign keys
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

#### 3.2 Seed Default Permissions

**New File:** `prisma/seeds/permissions.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPermissions() {
  const permissions = [
    // Lesson Management
    { name: 'lessons:view', description: 'View lessons', category: 'lessons' },
    { name: 'lessons:create', description: 'Create new lessons', category: 'lessons' },
    { name: 'lessons:edit', description: 'Edit lessons', category: 'lessons' },
    { name: 'lessons:delete', description: 'Delete lessons', category: 'lessons' },
    { name: 'lessons:publish', description: 'Publish/unpublish lessons', category: 'lessons' },

    // User Management
    { name: 'users:view', description: 'View user list', category: 'users' },
    { name: 'users:edit', description: 'Edit user details', category: 'users' },
    { name: 'users:delete', description: 'Delete users', category: 'users' },
    { name: 'users:manage_roles', description: 'Change user roles', category: 'users' },

    // Content Management
    { name: 'content:import', description: 'Import content', category: 'content' },
    { name: 'content:export', description: 'Export content', category: 'content' },

    // Analytics
    { name: 'analytics:view', description: 'View analytics', category: 'analytics' },
    { name: 'analytics:export', description: 'Export analytics data', category: 'analytics' },

    // System Administration
    { name: 'system:manage', description: 'Manage system settings', category: 'system' },
    { name: 'system:logs', description: 'View system logs', category: 'system' },
  ];

  console.log('Creating permissions...');

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Assign permissions to roles
  const allPermissions = await prisma.permission.findMany();

  // SUPER_ADMIN - All permissions
  console.log('Assigning permissions to SUPER_ADMIN...');
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: 'SUPER_ADMIN',
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        role: 'SUPER_ADMIN',
        permissionId: permission.id,
      },
    });
  }

  // ADMIN - Most permissions except system:manage
  console.log('Assigning permissions to ADMIN...');
  const adminPermissions = allPermissions.filter(p => p.name !== 'system:manage');
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: 'ADMIN',
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        role: 'ADMIN',
        permissionId: permission.id,
      },
    });
  }

  // USER - Basic view permissions only
  console.log('Assigning permissions to USER...');
  const userPermissions = allPermissions.filter(p =>
    p.name === 'lessons:view' || p.name === 'analytics:view'
  );
  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: 'USER',
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        role: 'USER',
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Permissions seeded successfully');
}

seedPermissions()
  .catch((e) => {
    console.error('Error seeding permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### 3.3 Create Permission Service

**New File:** `src/lib/permissions/service.ts`

```typescript
import { PrismaClient, UserRole } from '@prisma/client';
import { cache } from '@/utils/cache/redisClient';

const PERMISSION_CACHE_TTL = 3600; // 1 hour

/**
 * Check if a role has a specific permission
 */
export async function hasPermission(
  prisma: PrismaClient,
  role: UserRole,
  permissionName: string
): Promise<boolean> {
  // Super admins have all permissions
  if (role === 'SUPER_ADMIN') return true;

  // Check cache first
  const cacheKey = `permission:${role}:${permissionName}`;
  const cached = await cache.get<boolean>(cacheKey);
  if (cached !== null) return cached;

  // Query database
  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      role,
      permission: {
        name: permissionName
      }
    }
  });

  const hasAccess = !!rolePermission;

  // Cache result
  await cache.set(cacheKey, hasAccess, PERMISSION_CACHE_TTL);

  return hasAccess;
}

/**
 * Check if a role has multiple permissions (requires ALL)
 */
export async function hasAllPermissions(
  prisma: PrismaClient,
  role: UserRole,
  permissionNames: string[]
): Promise<boolean> {
  if (role === 'SUPER_ADMIN') return true;

  const checks = await Promise.all(
    permissionNames.map(name => hasPermission(prisma, role, name))
  );

  return checks.every(result => result === true);
}

/**
 * Check if a role has any of the specified permissions
 */
export async function hasAnyPermission(
  prisma: PrismaClient,
  role: UserRole,
  permissionNames: string[]
): Promise<boolean> {
  if (role === 'SUPER_ADMIN') return true;

  const checks = await Promise.all(
    permissionNames.map(name => hasPermission(prisma, role, name))
  );

  return checks.some(result => result === true);
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(
  prisma: PrismaClient,
  role: UserRole
): Promise<string[]> {
  // Check cache
  const cacheKey = `role_permissions:${role}`;
  const cached = await cache.get<string[]>(cacheKey);
  if (cached) return cached;

  // Super admins get all permissions
  if (role === 'SUPER_ADMIN') {
    const allPermissions = await prisma.permission.findMany({
      select: { name: true }
    });
    const names = allPermissions.map(p => p.name);
    await cache.set(cacheKey, names, PERMISSION_CACHE_TTL);
    return names;
  }

  // Query role permissions
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role },
    include: {
      permission: {
        select: { name: true }
      }
    }
  });

  const names = rolePermissions.map(rp => rp.permission.name);

  // Cache result
  await cache.set(cacheKey, names, PERMISSION_CACHE_TTL);

  return names;
}

/**
 * Invalidate permission cache for a role
 */
export async function invalidateRolePermissionCache(role: UserRole): Promise<void> {
  await cache.del(`role_permissions:${role}`);
  // Also clear individual permission checks
  await cache.clear(`permission:${role}:*`);
}
```

#### 3.4 Update Auth Helpers

**File:** `src/lib/auth-helpers.ts`

Implement the TODO:
```typescript
import { prisma } from '@/lib/prisma';
import { hasPermission, hasAllPermissions } from '@/lib/permissions/service';

/**
 * Require user to have a specific permission
 */
export async function requirePermission(
  permission: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  // Check permission
  const hasAccess = await hasPermission(prisma, user.role as any, permission);

  if (!hasAccess) {
    appLogger.warn('Permission denied', {
      userId: user.userId,
      role: user.role,
      permission,
      component: 'auth-helpers'
    });

    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Permission required: ${permission}`,
      403
    );
  }

  return user;
}

/**
 * Require user to have multiple permissions (ALL)
 */
export async function requirePermissions(
  permissions: string[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  const hasAccess = await hasAllPermissions(prisma, user.role as any, permissions);

  if (!hasAccess) {
    appLogger.warn('Permissions denied', {
      userId: user.userId,
      role: user.role,
      permissions,
      component: 'auth-helpers'
    });

    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Permissions required: ${permissions.join(', ')}`,
      403
    );
  }

  return user;
}

/**
 * Require user to have a specific role
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    appLogger.warn('Role requirement not met', {
      userId: user.userId,
      userRole: user.role,
      allowedRoles,
      component: 'auth-helpers'
    });

    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Role required: ${allowedRoles.join(' or ')}`,
      403
    );
  }

  return user;
}
```

#### 3.5 Update Admin Routes

**Example:** `src/app/api/admin/users/route.ts`

Replace role checks with permission checks:
```typescript
// Old approach
export async function GET() {
  const user = await requireAuth();
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  // ... rest of handler
}

// New approach with permissions
export async function GET() {
  const user = await requirePermission('users:view');
  // ... rest of handler
}

export async function POST() {
  const user = await requirePermission('users:create');
  // ... rest of handler
}

export async function DELETE() {
  const user = await requirePermission('users:delete');
  // ... rest of handler
}
```

### Acceptance Criteria

- [ ] Permission tables created in database
- [ ] Default permissions seeded for all roles
- [ ] `requirePermission()` checks database permissions
- [ ] `requirePermissions()` supports multiple permission checks
- [ ] `requireRole()` enforces role-based access
- [ ] Permission checks are cached (1 hour TTL)
- [ ] Admin routes use permission-based authorization
- [ ] SUPER_ADMIN has all permissions automatically
- [ ] Permission denied returns 403 with clear message
- [ ] Audit logs track permission checks

---

## Technical Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  - Welcome Page (subscription display)                      │
│  - Subscription Gate (tier checking)                        │
│  - Lesson Cards (completion rate display)                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ API Calls
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  - /api/user/subscription (tier data)                       │
│  - /api/lessons/recommendations (with completion rates)     │
│  - /api/lessons/search (with completion rates)              │
│  - Auth Helpers (permission checking)                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Business Logic
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  - completion-rate.ts (analytics calculations)              │
│  - permissions/service.ts (RBAC logic)                      │
│  - Auth callbacks (session enrichment)                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Data Access
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  - Prisma ORM                                               │
│  - Redis Cache (completion rates, permissions)              │
│  - PostgreSQL Database (Supabase)                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Feature 1: Subscription Tier Retrieval**
```
1. User authenticates → NextAuth session created
2. Auth callbacks fetch User.subscriptionTier from DB
3. Session includes subscription data
4. Client components access via useAuth() hook
5. UI renders based on actual tier
```

**Feature 2: Completion Rate Calculation**
```
1. API endpoint receives lesson list request
2. Extract lesson IDs from query
3. Check Redis cache for completion rates
4. If miss: Query UserProgress aggregates
5. Calculate rate: (completed / total) * 100
6. Cache result (1 hour TTL)
7. Return lessons with completion rates
8. Client displays rates in lesson cards
```

**Feature 3: Permission Checking**
```
1. API route calls requirePermission('action')
2. Extract user role from session
3. Check Redis cache for role-permission mapping
4. If miss: Query RolePermission table
5. Verify user has required permission
6. Cache result (1 hour TTL)
7. Allow/deny request based on permission
8. Log access attempt for audit
```

---

## Implementation Plan

### Phase 1: Subscription Tier Retrieval (2 hours)

**Tasks:**
1. Update NextAuth type definitions (15 min)
2. Modify auth callbacks to include subscription data (30 min)
3. Update Welcome page to use session data (20 min)
4. Update Subscription Gate component (30 min)
5. Verify subscription API endpoint (15 min)
6. Test subscription tier display (10 min)

**Deliverables:**
- [ ] Session includes subscription fields
- [ ] Welcome page shows actual tier
- [ ] Subscription gate uses real data
- [ ] All TODOs removed from subscription code

### Phase 2: Completion Rate Calculation (1.5 hours)

**Tasks:**
1. Create completion-rate utility functions (40 min)
2. Add Redis caching layer (20 min)
3. Update recommendations route (15 min)
4. Update search route (15 min)
5. Add cache invalidation on progress update (10 min)
6. Test bulk calculation performance (10 min)

**Deliverables:**
- [ ] Completion rate utility module created
- [ ] Caching implemented with 1-hour TTL
- [ ] Both API routes show real rates
- [ ] All TODOs removed from rate calculation code

### Phase 3: Permission System (2.5 hours)

**Tasks:**
1. Create database migration for permissions (20 min)
2. Write permission seed script (30 min)
3. Create permission service module (40 min)
4. Implement auth helper functions (30 min)
5. Update admin routes with permissions (20 min)
6. Test permission checks and caching (10 min)

**Deliverables:**
- [ ] Permission tables in database
- [ ] Default permissions seeded
- [ ] Permission service operational
- [ ] Auth helpers use database permissions
- [ ] TODO removed from auth-helpers.ts

### Phase 4: Testing & Documentation (1 hour)

**Tasks:**
1. Write unit tests for utilities (20 min)
2. Write integration tests for API routes (20 min)
3. Update API documentation (10 min)
4. Create admin guide for permissions (10 min)

**Deliverables:**
- [ ] Test coverage >80% for new code
- [ ] API docs updated
- [ ] Admin permission guide created

---

## Testing Strategy

### Unit Tests

**File:** `src/lib/analytics/__tests__/completion-rate.test.ts`

```typescript
describe('Completion Rate Calculations', () => {
  it('should calculate 0% for lessons with no progress', async () => {
    const rate = await calculateLessonCompletionRate(prisma, 'new-lesson-id');
    expect(rate).toBe(0);
  });

  it('should calculate 100% when all users completed', async () => {
    // Setup: Create lesson and mark all progress as completed
    const rate = await calculateLessonCompletionRate(prisma, 'lesson-id');
    expect(rate).toBe(100);
  });

  it('should calculate 50% when half completed', async () => {
    // Setup: 2 completed, 2 in progress
    const rate = await calculateLessonCompletionRate(prisma, 'lesson-id');
    expect(rate).toBe(50);
  });

  it('should use cached values when available', async () => {
    await cache.set('completion_rate:lesson-1', 75, 3600);
    const rate = await calculateLessonCompletionRate(prisma, 'lesson-1');
    expect(rate).toBe(75);
    // Verify no DB query was made
  });
});
```

**File:** `src/lib/permissions/__tests__/service.test.ts`

```typescript
describe('Permission Service', () => {
  it('should grant all permissions to SUPER_ADMIN', async () => {
    const result = await hasPermission(prisma, 'SUPER_ADMIN', 'any:permission');
    expect(result).toBe(true);
  });

  it('should check database for other roles', async () => {
    const result = await hasPermission(prisma, 'USER', 'lessons:view');
    expect(result).toBe(true); // USER has view permission
  });

  it('should deny permission when not granted', async () => {
    const result = await hasPermission(prisma, 'USER', 'users:delete');
    expect(result).toBe(false);
  });

  it('should cache permission checks', async () => {
    await hasPermission(prisma, 'ADMIN', 'lessons:edit');
    const cached = await cache.get('permission:ADMIN:lessons:edit');
    expect(cached).toBe(true);
  });
});
```

### Integration Tests

**File:** `src/app/api/lessons/recommendations/__tests__/route.test.ts`

```typescript
describe('GET /api/lessons/recommendations', () => {
  it('should return lessons with real completion rates', async () => {
    const res = await GET(mockRequest);
    const data = await res.json();

    expect(data.sections).toBeDefined();
    data.sections.forEach((section: any) => {
      section.lessons.forEach((lesson: any) => {
        expect(lesson.completionRate).toBeGreaterThanOrEqual(0);
        expect(lesson.completionRate).toBeLessThanOrEqual(100);
        expect(typeof lesson.completionRate).toBe('number');
      });
    });
  });
});
```

### Manual Testing Checklist

**Subscription Tier Display:**
- [ ] Free user sees "Free" tier in welcome page
- [ ] Pro user sees "Pro" tier in welcome page
- [ ] Subscription gate blocks free user from pro content
- [ ] Subscription gate allows pro user access to pro content
- [ ] Trial users see trial status
- [ ] Expired subscriptions show downgrade message

**Completion Rates:**
- [ ] New lessons show 0% completion rate
- [ ] Lessons with progress show accurate percentage
- [ ] Completion rates update after user completes lesson
- [ ] Rates are cached and load quickly on subsequent requests
- [ ] Bulk calculation performs well with 50+ lessons

**Permissions:**
- [ ] SUPER_ADMIN can access all admin routes
- [ ] ADMIN can access most admin routes
- [ ] USER cannot access admin routes
- [ ] Permission denied shows clear error message
- [ ] Permission checks are cached for performance
- [ ] Audit logs show permission check attempts

---

## Rollout Plan

### Pre-Deployment

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Permissions**
   ```bash
   npx tsx prisma/seeds/permissions.ts
   ```

3. **Verify Caching**
   ```bash
   # Test Redis connection
   npm run test:cache
   ```

### Deployment

1. **Deploy to Staging**
   - Run all tests
   - Verify subscription display
   - Test completion rates
   - Test permissions

2. **Staging Validation** (30 minutes)
   - Create test users with different tiers
   - Verify welcome page personalization
   - Check lesson recommendation rates
   - Test admin permission checks
   - Monitor logs for errors

3. **Deploy to Production**
   - Deploy code changes
   - Run database migrations
   - Seed permissions
   - Monitor error rates
   - Check performance metrics

### Post-Deployment

1. **Monitor** (First 24 hours)
   - API response times
   - Cache hit rates
   - Error logs
   - Permission denied attempts
   - Database query performance

2. **Metrics to Track**
   - Average completion rate calculation time
   - Cache hit rate for completion rates
   - Permission check latency
   - Subscription tier distribution

3. **Rollback Plan**
   - If completion rates cause performance issues: Fall back to cached/static values
   - If permission system fails: Revert to role-based checks
   - If subscription display breaks: Show "Free" as default

---

## Success Metrics

### Functionality Metrics
- ✅ All 6 TODO comments resolved
- ✅ 100% of users see accurate subscription tier
- ✅ Completion rates accurate to ±2%
- ✅ Permission checks functional for all roles

### Performance Metrics
- Target: Completion rate calculation <50ms (cached)
- Target: Permission check <10ms (cached)
- Target: Cache hit rate >90% after warm-up
- Target: No increase in API response times

### Quality Metrics
- Test coverage >80% for new code
- Zero production errors from new features
- All acceptance criteria met
- Documentation complete

---

## Dependencies

### External Dependencies
- Redis (for caching)
- Supabase PostgreSQL (for data storage)
- NextAuth (for session management)

### Internal Dependencies
- Existing auth system
- Prisma ORM
- Logger infrastructure
- Cache utilities

---

## Risks & Mitigation

### Risk 1: Performance Impact
**Risk:** Completion rate calculations slow down API responses
**Impact:** High - Affects user experience
**Mitigation:**
- Implement aggressive caching (1 hour TTL)
- Use bulk calculation for efficiency
- Add database indexes on UserProgress
- Monitor query performance

### Risk 2: Cache Inconsistency
**Risk:** Cached data becomes stale after updates
**Impact:** Medium - Shows inaccurate data temporarily
**Mitigation:**
- Invalidate cache on relevant updates
- Use reasonable TTL (1 hour)
- Log cache misses for monitoring

### Risk 3: Permission System Complexity
**Risk:** Permission checks add cognitive overhead
**Impact:** Medium - Developers may misuse system
**Mitigation:**
- Clear documentation and examples
- Helper functions for common patterns
- Automated tests for permission checks
- Admin UI for permission management

### Risk 4: Migration Issues
**Risk:** Permission migration fails in production
**Impact:** High - Breaks admin functionality
**Mitigation:**
- Test migration thoroughly in staging
- Run migration during low-traffic window
- Have rollback script ready
- Monitor for errors post-deployment

---

## Future Enhancements

### Phase 2 (Post-Launch)
1. **Permission Management UI**
   - Admin interface to manage permissions
   - Role editor with permission assignments
   - Audit log viewer

2. **Advanced Completion Analytics**
   - Time-based completion trends
   - Cohort analysis
   - Difficulty-based completion correlation

3. **Subscription Features**
   - Usage-based limits
   - Feature flags per tier
   - Automatic upgrades/downgrades

4. **Custom Roles**
   - User-defined roles
   - Fine-grained permissions
   - Team-specific permissions

---

## Questions & Decisions

### Decision Log

**Q1:** Should completion rates be user-specific or global?
**A1:** Global (lesson-level) - Shows overall lesson difficulty/engagement

**Q2:** How long should we cache completion rates?
**A2:** 1 hour - Balances freshness with performance

**Q3:** Should we cache permission checks?
**A3:** Yes - Permissions rarely change, caching significantly improves performance

**Q4:** Should SUPER_ADMIN bypass permission checks?
**A4:** Yes - Simplifies code and provides emergency access

---

## Appendix

### Code Snippets

**Subscription Display Example:**
```typescript
const { user } = useAuth();
const tier = user?.subscriptionTier || 'free';

return (
  <Badge variant={tier === 'pro' ? 'default' : 'secondary'}>
    {tier.toUpperCase()}
  </Badge>
);
```

**Completion Rate Display Example:**
```typescript
<div className="flex items-center gap-2">
  <Progress value={lesson.completionRate} />
  <span className="text-sm text-muted-foreground">
    {lesson.completionRate}% completed
  </span>
</div>
```

**Permission Check Example:**
```typescript
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requirePermission('lessons:delete');

  await prisma.lesson.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ success: true });
}
```

### Related Documentation
- [NextAuth Documentation](https://next-auth.js.org/configuration/callbacks)
- [Prisma Aggregations](https://www.prisma.io/docs/concepts/components/prisma-client/aggregation-grouping-summarizing)
- [Redis Caching Best Practices](https://redis.io/topics/lru-cache)
- [RBAC Design Patterns](https://auth0.com/docs/manage-users/access-control/rbac)

---

**Document Version:** 1.0
**Last Reviewed:** 2025-10-11
**Next Review:** 2025-10-18 (after implementation)
**Owner:** Development Team
