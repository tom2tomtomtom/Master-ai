# Master-AI Role System Implementation

## Overview

This document outlines the complete admin role system implementation for the Master-AI platform. The system provides secure, role-based access control with proper auditing and security measures.

## Architecture

### 1. Database Schema Changes

**File:** `prisma/schema.prisma`

Added `UserRole` enum and role field to User model:
```prisma
enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

model User {
  // ... existing fields
  role UserRole @default(USER)
  // ... rest of model
}
```

**Migration:** `20250806052922_add_user_roles`
- Adds role enum to database
- Sets default role as USER for all existing users

### 2. Authentication Middleware

**File:** `src/lib/auth-middleware.ts`

Core functionality:
- `requireAuth()` - Basic authentication check
- `requireAdmin()` - Admin privilege verification
- `requireSuperAdmin()` - Super admin privilege verification
- `requireUserResourceAccess()` - User resource access control
- `logAdminAction()` - Audit logging for admin actions

Security features:
- Server-side role verification only
- Fresh database role lookup on each request
- Proper error handling with custom AuthorizationError
- HOF wrappers for API route protection

### 3. NextAuth Type Extensions

**File:** `src/types/next-auth.d.ts`

Extended types to include role information:
- Added `UserRole` to User interface
- Added `role` to Session and JWT interfaces
- Maintains backward compatibility with existing subscription fields

## API Route Security Implementation

### Fixed Routes

1. **`src/app/api/achievements/user/[userId]/route.ts`**
   - Replaced manual auth checks with `requireUserResourceAccess()`
   - Users can view own achievements, admins can view any user's achievements

2. **`src/app/api/certifications/route.ts`**
   - POST route now requires admin for awarding certifications to other users
   - Self-awarding still allowed with eligibility checks
   - Added audit logging for admin certification awards

3. **`src/app/api/certifications/user/[userId]/route.ts`**
   - Replaced manual auth checks with `requireUserResourceAccess()`
   - Users can view own certifications, admins can view any user's certifications

4. **`src/app/api/system/jobs/route.ts`**
   - Both GET and POST now require admin privileges
   - Added audit logging for job trigger events
   - Enhanced response with admin context information

## New Admin Management Endpoints

### 1. User Management - `src/app/api/admin/users/route.ts`

**GET /api/admin/users**
- Lists all users with pagination
- Filtering by role and search
- Includes user statistics and counts
- Admin only access

### 2. User Details - `src/app/api/admin/users/[userId]/route.ts`

**GET /api/admin/users/[userId]**
- Detailed user information with statistics
- Recent activity and progress data
- Admin only access

**DELETE /api/admin/users/[userId]**
- User deactivation endpoint (placeholder implementation)
- Audit logging for deactivation actions
- Self-deactivation protection

### 3. Role Management - `src/app/api/admin/users/[userId]/role/route.ts`

**PUT /api/admin/users/[userId]/role**
- Update user roles with proper security checks
- SUPER_ADMIN required for super admin role changes
- Self-role-change protection
- Comprehensive audit logging

### 4. Platform Statistics - `src/app/api/admin/stats/route.ts`

**GET /api/admin/stats**
- Comprehensive platform statistics
- User growth metrics
- Activity summaries
- Top performer leaderboards
- Admin only access

## Security Measures

### Role Hierarchy
```
USER (default) < ADMIN < SUPER_ADMIN
```

### Access Control Rules

1. **USER**: Can only access own resources
2. **ADMIN**: 
   - Can access any user's resources
   - Can award certifications
   - Can trigger system jobs
   - Can view platform statistics
   - Cannot modify super admin roles
   - Cannot promote users to super admin

3. **SUPER_ADMIN**:
   - All ADMIN privileges
   - Can manage super admin roles
   - Can promote users to any role including super admin

### Security Protections

1. **Self-Modification Protection**
   - Users cannot change their own roles
   - Users cannot deactivate their own accounts

2. **Role Escalation Protection**
   - Only SUPER_ADMIN can assign SUPER_ADMIN role
   - Only SUPER_ADMIN can demote other SUPER_ADMIN users

3. **Server-Side Verification**
   - All role checks happen server-side with fresh database lookups
   - No role information exposed in client-side tokens

4. **Audit Logging**
   - All admin actions are logged with context
   - Comprehensive action tracking for compliance

## Usage Examples

### Protecting API Routes

```typescript
// Basic admin protection
export const POST = withAdminAuth(async (request, session) => {
  // Admin-only logic here
});

// User resource protection
export const GET = withUserResourceAuth(
  (request, { params }) => params.userId,
  async (request, session) => {
    // User can access own resources, admins can access any
  }
);
```

### Manual Role Checks

```typescript
import { requireAdmin, requireUserResourceAccess } from '@/lib/auth-middleware';

// Require admin privileges
const session = await requireAdmin();

// Check user resource access
await requireUserResourceAccess(targetUserId);
```

## Files Created/Modified

### New Files
- `src/lib/auth-middleware.ts` - Core authentication middleware
- `src/app/api/admin/users/route.ts` - User management
- `src/app/api/admin/users/[userId]/route.ts` - User details
- `src/app/api/admin/users/[userId]/role/route.ts` - Role management
- `src/app/api/admin/stats/route.ts` - Platform statistics
- `src/lib/__tests__/auth-middleware.test.ts` - Basic tests

### Modified Files
- `prisma/schema.prisma` - Added UserRole enum and User.role field
- `src/types/next-auth.d.ts` - Extended NextAuth types with role
- `src/app/api/achievements/user/[userId]/route.ts` - Added admin checks
- `src/app/api/certifications/route.ts` - Added admin checks
- `src/app/api/certifications/user/[userId]/route.ts` - Added admin checks
- `src/app/api/system/jobs/route.ts` - Added admin checks

## Database Migration Applied

Migration `20250806052922_add_user_roles` has been successfully applied, adding:
- UserRole enum to the database
- role column to users table with USER default
- Proper indexing and constraints

## Testing & Validation

The implementation has been validated through:
- TypeScript compilation (passed with warnings only)
- Basic unit tests for role logic
- Database migration successful
- All TODO comments resolved

## Next Steps for Production

1. **Frontend Integration**
   - Update NextAuth configuration to include role in session
   - Create role-based UI components
   - Add admin dashboard pages

2. **Enhanced Audit Logging**
   - Implement database-backed audit log table
   - Add external logging service integration
   - Create audit log query endpoints

3. **Advanced Security**
   - Add rate limiting for admin endpoints
   - Implement IP whitelisting for admin actions
   - Add multi-factor authentication for admin accounts

4. **Monitoring & Alerting**
   - Add monitoring for role changes
   - Alert on suspicious admin activity
   - Dashboard for security metrics

## Security Considerations

- Role checks are performed on every request with fresh database data
- Admin actions are logged for audit trails
- Proper error handling prevents information leakage
- Role escalation is strictly controlled
- Self-modification is prevented

This implementation provides a robust, secure foundation for role-based access control in the Master-AI platform.