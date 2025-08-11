/**
 * Notification Service
 * 
 * Handles sending achievement and certification notifications
 */

import { PrismaClient } from '@prisma/client';
import { NotificationBatch } from './types';

export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Send achievement notifications in optimized batches
   * OPTIMIZED: Batch database queries, parallel processing
   */
  async sendBatch(notifications: NotificationBatch[]): Promise<number> {
    if (notifications.length === 0) return 0;

    try {
      // Collect all unique IDs for batch queries
      const userIds = [...new Set(notifications.map(n => n.userId))];
      const achievementIds = [...new Set(notifications.flatMap(n => n.achievements))];
      const certificationIds = [...new Set(notifications.flatMap(n => n.certifications))];

      // Batch fetch all required data
      const [users, achievements, certifications] = await Promise.all([
        this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true },
        }),
        achievementIds.length > 0 ? this.prisma.achievement.findMany({
          where: { id: { in: achievementIds } },
          select: { id: true, name: true, description: true },
        }) : [],
        certificationIds.length > 0 ? this.prisma.certification.findMany({
          where: { id: { in: certificationIds } },
          select: { id: true, name: true, description: true },
        }) : [],
      ]);

      // Create lookup maps
      const userMap = new Map(users.map(u => [u.id, u]));
      const achievementMap = new Map(achievements.map(a => [a.id, a]));
      const certificationMap = new Map(certifications.map(c => [c.id, c]));

      let sentCount = 0;

      // Process notifications sequentially to avoid overwhelming email service
      for (const notification of notifications) {
        try {
          const user = userMap.get(notification.userId);
          if (!user?.email) continue;

          const userAchievements = notification.achievements
            .map(id => achievementMap.get(id))
            .filter(Boolean);
          
          const userCertifications = notification.certifications
            .map(id => certificationMap.get(id))
            .filter(Boolean);

          // Send achievement notification email if enabled
          await this.sendNotificationEmail(user, userAchievements, userCertifications);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send notification to user ${notification.userId}:`, error);
        }
      }

      return sentCount;
    } catch (error) {
      console.error('Error in batch notification sending:', error);
      return 0;
    }
  }

  /**
   * Send notification email to user
   */
  private async sendNotificationEmail(
    user: { email: string; name: string | null },
    achievements: any[],
    certifications: any[]
  ): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production' && process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true') {
        const { sendAchievementNotification } = await import('@/lib/email');
        await sendAchievementNotification({
          to: user.email,
          name: user.name || 'User',
          achievements,
          certifications,
        });
      }
    } catch (emailError) {
      console.error('Failed to send achievement notification email:', emailError);
      // Continue processing - email failures shouldn't stop background jobs
    }
  }
}