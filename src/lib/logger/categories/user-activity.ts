/**
 * User Activity Logging Category
 * 
 * Handles user activity logging events
 */

import winston from 'winston';
import { ExtendedUser } from '../../supabase-auth-middleware';
import { sanitizeLogData } from '../utils';

export class UserActivityLogger {
  constructor(private logger: winston.Logger) {}

  profileUpdated(user: ExtendedUser, changes: string[], requestMeta: any) {
    this.logger.info('User profile updated', {
      category: 'user_activity',
      event: 'profile_updated',
      userId: user.id,
      userEmail: user.email,
      changes,
      ...sanitizeLogData(requestMeta)
    });
  }

  lessonStarted(user: ExtendedUser, lessonId: string, lessonTitle: string) {
    this.logger.info('User started lesson', {
      category: 'user_activity',
      event: 'lesson_started',
      userId: user.id,
      lessonId,
      lessonTitle
    });
  }

  lessonCompleted(user: ExtendedUser, lessonId: string, lessonTitle: string, duration: number) {
    this.logger.info('User completed lesson', {
      category: 'user_activity',
      event: 'lesson_completed',
      userId: user.id,
      lessonId,
      lessonTitle,
      duration
    });
  }

  subscriptionChanged(user: ExtendedUser, oldTier: string, newTier: string, requestMeta: any) {
    this.logger.info('User subscription changed', {
      category: 'user_activity',
      event: 'subscription_changed',
      userId: user.id,
      userEmail: user.email,
      oldTier,
      newTier,
      ...sanitizeLogData(requestMeta)
    });
  }
}