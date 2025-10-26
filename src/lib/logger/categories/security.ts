/**
 * Security Logging Category
 * 
 * Handles security-related logging events
 */

import winston from 'winston';
import { ExtendedUser } from '../../supabase-auth-middleware';
import { sanitizeLogData } from '../utils';

export class SecurityLogger {
  constructor(private logger: winston.Logger) {}

  loginSuccess(user: ExtendedUser, requestMeta: any) {
    this.logger.info('User login successful', {
      category: 'security',
      event: 'login_success',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ...sanitizeLogData(requestMeta)
    });
  }

  loginFailure(email: string, reason: string, requestMeta: any) {
    this.logger.warn('User login failed', {
      category: 'security',
      event: 'login_failure',
      email: email,
      reason,
      ...sanitizeLogData(requestMeta)
    });
  }

  logout(user: ExtendedUser, requestMeta: any) {
    this.logger.info('User logged out', {
      category: 'security',
      event: 'logout',
      userId: user.id,
      userEmail: user.email,
      ...sanitizeLogData(requestMeta)
    });
  }

  passwordResetRequested(email: string, requestMeta: any) {
    this.logger.info('Password reset requested', {
      category: 'security',
      event: 'password_reset_requested',
      email,
      ...sanitizeLogData(requestMeta)
    });
  }

  passwordResetCompleted(user: ExtendedUser, requestMeta: any) {
    this.logger.info('Password reset completed', {
      category: 'security',
      event: 'password_reset_completed',
      userId: user.id,
      userEmail: user.email,
      ...sanitizeLogData(requestMeta)
    });
  }

  xssAttemptBlocked(attempt: string, requestMeta: any) {
    this.logger.warn('XSS attempt blocked', {
      category: 'security',
      event: 'xss_attempt_blocked',
      attempt: attempt.substring(0, 200), // Limit size
      ...sanitizeLogData(requestMeta)
    });
  }

  unauthorizedAccess(resource: string, user: ExtendedUser | null, requestMeta: any) {
    this.logger.warn('Unauthorized access attempt', {
      category: 'security',
      event: 'unauthorized_access',
      resource,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      ...sanitizeLogData(requestMeta)
    });
  }

  rateLimitExceeded(identifier: string, endpoint: string, requestMeta: any) {
    this.logger.warn('Rate limit exceeded', {
      category: 'security',
      event: 'rate_limit_exceeded',
      identifier,
      endpoint,
      ...sanitizeLogData(requestMeta)
    });
  }
}