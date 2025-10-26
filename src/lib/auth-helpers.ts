/**
 * Authentication Helper Utilities
 *
 * Centralized authentication functions to eliminate duplicate auth patterns
 * across API routes. Use these instead of repeating getServerSession logic.
 *
 * @module auth-helpers
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { appLogger } from './logger';

/**
 * Authenticated user information
 */
export interface AuthenticatedUser {
  userId: string;
  email: string | null | undefined;
  name: string | null | undefined;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string;
}

/**
 * Authentication error codes
 */
export enum AuthErrorCode {
  NO_SESSION = 'NO_SESSION',
  NO_USER_ID = 'NO_USER_ID',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INSUFFICIENT_SUBSCRIPTION = 'INSUFFICIENT_SUBSCRIPTION',
}

/**
 * Authentication error class
 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Requires user to be authenticated
 *
 * Throws AuthError if user is not authenticated.
 * Returns authenticated user information if successful.
 *
 * @throws {AuthError} If user is not authenticated
 * @returns {Promise<AuthenticatedUser>} Authenticated user information
 *
 * @example
 * ```typescript
 * // In an API route:
 * export async function GET(request: NextRequest) {
 *   const user = await requireAuth();
 *   // Use user.userId, user.role, etc.
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      appLogger.warn('Authentication required but no session found');
      throw new AuthError(
        AuthErrorCode.NO_SESSION,
        'Authentication required',
        401
      );
    }

    if (!session.user?.id) {
      appLogger.error('Session found but user.id is missing', {
        sessionUser: session.user,
      });
      throw new AuthError(
        AuthErrorCode.NO_USER_ID,
        'Invalid session: user ID missing',
        401
      );
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      subscriptionTier: session.user.subscriptionTier,
      subscriptionStatus: session.user.subscriptionStatus,
    };
  } catch (error) {
    // Re-throw AuthError as-is
    if (error instanceof AuthError) {
      throw error;
    }

    // Log and wrap unexpected errors
    appLogger.error('Unexpected error during authentication', {
      error,
    });
    throw new AuthError(
      AuthErrorCode.NO_SESSION,
      'Authentication failed',
      500
    );
  }
}

/**
 * Requires user to have specific role
 *
 * @param {string | string[]} allowedRoles - Role(s) required for access
 * @throws {AuthError} If user doesn't have required role
 * @returns {Promise<AuthenticatedUser>} Authenticated user information
 *
 * @example
 * ```typescript
 * // Require ADMIN role
 * const user = await requireRole('ADMIN');
 *
 * // Allow multiple roles
 * const user = await requireRole(['ADMIN', 'MODERATOR']);
 * ```
 */
export async function requireRole(
  allowedRoles: string | string[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    appLogger.warn('Insufficient permissions', {
      userId: user.userId,
      userRole: user.role,
      requiredRoles: roles,
    });
    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Required role: ${roles.join(' or ')}`,
      403
    );
  }

  return user;
}

/**
 * Subscription tier levels (in ascending order of access)
 */
export const SubscriptionTiers = {
  FREE: 'FREE',
  PRO: 'PRO',
  TEAM: 'TEAM',
} as const;

export type SubscriptionTier = typeof SubscriptionTiers[keyof typeof SubscriptionTiers];

/**
 * Tier hierarchy for access checks
 */
const tierHierarchy: Record<SubscriptionTier, number> = {
  [SubscriptionTiers.FREE]: 0,
  [SubscriptionTiers.PRO]: 1,
  [SubscriptionTiers.TEAM]: 2,
};

/**
 * Requires user to have minimum subscription tier
 *
 * @param {SubscriptionTier} minimumTier - Minimum tier required
 * @throws {AuthError} If user doesn't have sufficient subscription
 * @returns {Promise<AuthenticatedUser>} Authenticated user information
 *
 * @example
 * ```typescript
 * // Require PRO subscription
 * const user = await requireSubscription(SubscriptionTiers.PRO);
 * ```
 */
export async function requireSubscription(
  minimumTier: SubscriptionTier
): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  const userTierLevel = tierHierarchy[user.subscriptionTier as SubscriptionTier] ?? 0;
  const requiredTierLevel = tierHierarchy[minimumTier] ?? 0;

  if (userTierLevel < requiredTierLevel) {
    appLogger.warn('Insufficient subscription tier', {
      userId: user.userId,
      userTier: user.subscriptionTier,
      requiredTier: minimumTier,
    });
    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_SUBSCRIPTION,
      `Required subscription: ${minimumTier} or higher`,
      403
    );
  }

  // Also check subscription status
  if (user.subscriptionStatus !== 'ACTIVE' && user.subscriptionTier !== SubscriptionTiers.FREE) {
    appLogger.warn('Inactive subscription', {
      userId: user.userId,
      subscriptionStatus: user.subscriptionStatus,
    });
    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_SUBSCRIPTION,
      'Subscription is not active',
      403
    );
  }

  return user;
}

/**
 * Gets optional authentication (doesn't throw if not authenticated)
 *
 * Useful for endpoints that have different behavior for authenticated vs unauthenticated users.
 *
 * @returns {Promise<AuthenticatedUser | null>} User info if authenticated, null otherwise
 *
 * @example
 * ```typescript
 * const user = await getOptionalAuth();
 * if (user) {
 *   // Show personalized content
 * } else {
 *   // Show public content
 * }
 * ```
 */
export async function getOptionalAuth(): Promise<AuthenticatedUser | null> {
  try {
    return await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return null;
    }
    throw error;
  }
}

/**
 * Checks if user has specific permission
 *
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>} True if user has permission
 *
 * @example
 * ```typescript
 * if (await hasPermission('manage_content')) {
 *   // Allow content management
 * }
 * ```
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const user = await requireAuth();

    // ADMIN has all permissions
    if (user.role === 'ADMIN') {
      return true;
    }

    // TODO: Implement permission checking against database
    // For now, return false for non-admin users
    return false;
  } catch {
    return false;
  }
}
