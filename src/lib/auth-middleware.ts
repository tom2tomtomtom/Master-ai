import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Custom error class for authorization failures
 */
export class AuthorizationError extends Error {
  public readonly status: number;
  
  constructor(message: string, status: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = status;
  }
}

/**
 * Extended session type that includes role information
 */
export interface ExtendedSession extends Session {
  user: Session['user'] & {
    role?: UserRole;
  };
}

/**
 * Get authenticated session with role information
 * Fetches fresh role data from database to ensure accuracy
 */
export async function getAuthenticatedSession(): Promise<ExtendedSession | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  // Fetch fresh user data including role from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      id: true,
      email: true,
      name: true,
      image: true,
      role: true 
    }
  });

  if (!user) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: user.role
    }
  } as ExtendedSession;
}

/**
 * Check if a user has admin privileges (ADMIN or SUPER_ADMIN)
 */
export function hasAdminRole(session: ExtendedSession | null): boolean {
  return session?.user?.role === UserRole.ADMIN || 
         session?.user?.role === UserRole.SUPER_ADMIN;
}

/**
 * Check if a user has super admin privileges
 */
export function hasSuperAdminRole(session: ExtendedSession | null): boolean {
  return session?.user?.role === UserRole.SUPER_ADMIN;
}

/**
 * Middleware to require authentication
 * Throws AuthorizationError if user is not authenticated
 */
export async function requireAuth(): Promise<ExtendedSession> {
  const session = await getAuthenticatedSession();
  
  if (!session) {
    throw new AuthorizationError('Authentication required', 401);
  }
  
  return session;
}

/**
 * Middleware to require admin privileges
 * Throws AuthorizationError if user is not an admin
 */
export async function requireAdmin(): Promise<ExtendedSession> {
  const session = await requireAuth();
  
  if (!hasAdminRole(session)) {
    throw new AuthorizationError('Admin privileges required', 403);
  }
  
  return session;
}

/**
 * Middleware to require super admin privileges
 * Throws AuthorizationError if user is not a super admin
 */
export async function requireSuperAdmin(): Promise<ExtendedSession> {
  const session = await requireAuth();
  
  if (!hasSuperAdminRole(session)) {
    throw new AuthorizationError('Super admin privileges required', 403);
  }
  
  return session;
}

/**
 * Check if user can access another user's resources
 * Users can access their own resources, admins can access any user's resources
 */
export async function canAccessUserResources(
  targetUserId: string,
  currentSession?: ExtendedSession | null
): Promise<boolean> {
  const session = currentSession || await getAuthenticatedSession();
  
  if (!session) {
    return false;
  }
  
  // Users can access their own resources
  if (session.user.id === targetUserId) {
    return true;
  }
  
  // Admins can access any user's resources
  return hasAdminRole(session);
}

/**
 * Middleware to require user resource access
 * Throws AuthorizationError if user cannot access the specified user's resources
 */
export async function requireUserResourceAccess(
  targetUserId: string,
  currentSession?: ExtendedSession | null
): Promise<ExtendedSession> {
  const session = currentSession || await requireAuth();
  
  const canAccess = await canAccessUserResources(targetUserId, session);
  
  if (!canAccess) {
    throw new AuthorizationError('Insufficient permissions to access user resources', 403);
  }
  
  return session;
}

/**
 * Utility function to handle API route authorization errors
 * Returns appropriate NextResponse for authorization failures
 */
export function handleAuthError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.status,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Generic server error for unexpected errors
  console.error('Unexpected authorization error:', error);
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Higher-order function to wrap API handlers with authentication/authorization
 * Usage:
 * export const GET = withAuth(async (request, session) => {
 *   // Handler logic with authenticated session
 * });
 * 
 * export const POST = withAdminAuth(async (request, session) => {
 *   // Handler logic with admin session
 * });
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, session: ExtendedSession, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const session = await requireAuth();
      return handler(request, session, ...args);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}

export function withAdminAuth<T extends any[]>(
  handler: (request: NextRequest, session: ExtendedSession, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const session = await requireAdmin();
      return handler(request, session, ...args);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}

export function withUserResourceAuth<T extends any[]>(
  getTargetUserId: (request: NextRequest, ...args: T) => string,
  handler: (request: NextRequest, session: ExtendedSession, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const session = await requireAuth();
      const targetUserId = getTargetUserId(request, ...args);
      await requireUserResourceAccess(targetUserId, session);
      return handler(request, session, ...args);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}

/**
 * Audit logging for admin actions
 */
export async function logAdminAction(
  session: ExtendedSession,
  action: string,
  details?: Record<string, any>
) {
  if (!hasAdminRole(session)) {
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: session.user.id,
    userEmail: session.user.email,
    userRole: session.user.role,
    action,
    details: details || {}
  };

  // Log to console for now - in production, this should go to a proper audit log
  console.log('ADMIN_ACTION:', JSON.stringify(logEntry, null, 2));

  // TODO: Implement proper audit logging to database or external service
  // This could include:
  // - Database table for audit logs
  // - External logging service (e.g., DataDog, CloudWatch)
  // - Security monitoring integration
}