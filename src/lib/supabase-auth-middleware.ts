import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PrismaClient, UserRole } from '@prisma/client';
import type { User } from '@supabase/supabase-js'
import { appLogger } from '@/lib/logger';

// Initialize Prisma client with better error handling
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient | null {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
    } catch (error) {
      appLogger.warn('Failed to initialize Prisma client', { error });
      return null;
    }
  }
  return prisma;
}

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
 * Extended user type that includes role information
 */
export interface ExtendedUser extends User {
  role?: UserRole;
}

/**
 * Auth session with extended user
 */
export interface AuthSession {
  user: ExtendedUser;
}

/**
 * Get authenticated user with role information
 */
export async function getAuthenticatedUser(): Promise<ExtendedUser | null> {
  try {
    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      appLogger.warn('Supabase environment variables not configured for server auth');
      return null;
    }
    
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null;
    }

    // Fetch role from our database
    const prismaClient = getPrismaClient();
    let dbUser = null;
    
    if (prismaClient && user.email) {
      try {
        dbUser = await prismaClient.user.findUnique({
          where: { email: user.email },
          select: { 
            role: true 
          }
        });
      } catch (error) {
        appLogger.warn('Failed to fetch user role from database', { error });
      }
    }

    return {
      ...user,
      role: dbUser?.role || UserRole.USER
    } as ExtendedUser;
  } catch (error) {
    appLogger.error('Error getting authenticated user', { error });
    return null;
  }
}

/**
 * Check if a user has admin privileges (ADMIN or SUPER_ADMIN)
 */
export function hasAdminRole(user: ExtendedUser | null): boolean {
  return user?.role === UserRole.ADMIN || 
         user?.role === UserRole.SUPER_ADMIN;
}

/**
 * Check if a user has super admin privileges
 */
export function hasSuperAdminRole(user: ExtendedUser | null): boolean {
  return user?.role === UserRole.SUPER_ADMIN;
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(): Promise<ExtendedUser> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new AuthorizationError('Authentication required', 401);
  }
  
  return user;
}

/**
 * Middleware to require admin privileges
 */
export async function requireAdmin(): Promise<ExtendedUser> {
  const user = await requireAuth();
  
  if (!hasAdminRole(user)) {
    throw new AuthorizationError('Admin privileges required', 403);
  }
  
  return user;
}

/**
 * Middleware to require super admin privileges
 */
export async function requireSuperAdmin(): Promise<ExtendedUser> {
  const user = await requireAuth();
  
  if (!hasSuperAdminRole(user)) {
    throw new AuthorizationError('Super admin privileges required', 403);
  }
  
  return user;
}

/**
 * Utility function to handle API route authorization errors
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

  appLogger.error('Unexpected authorization error', { error });
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Higher-order function to wrap API handlers with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: ExtendedUser, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await requireAuth();
      return handler(request, user, ...args);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}

export function withAdminAuth<T extends any[]>(
  handler: (request: NextRequest, user: ExtendedUser, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await requireAdmin();
      return handler(request, user, ...args);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}

/**
 * Audit logging for admin actions
 */
export async function logAdminAction(
  user: ExtendedUser,
  action: string,
  details?: Record<string, any>
) {
  if (!hasAdminRole(user)) {
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action,
    details: details || {}
  };

  appLogger.info('ADMIN_ACTION', logEntry);
}

/**
 * Validates that a user can access a specific resource
 * Used for user-specific endpoints where users can only access their own data
 * Admins can access any user's data
 */
export async function requireUserResourceAccess(resourceUserId: string): Promise<ExtendedUser> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new AuthorizationError('Authentication required', 401);
  }
  
  // User can access their own resources, or admin can access anyone's
  if (user.id === resourceUserId || hasAdminRole(user)) {
    return user;
  }
  
  throw new AuthorizationError('Forbidden: Cannot access this user resource');
}