/**
 * Test Data Setup Module
 *
 * Creates or retrieves test users and data for performance testing
 */

import type { PrismaClient } from '@prisma/client';

/**
 * Setup test data if needed
 *
 * Either uses a provided user ID or creates a new test user with sample data
 *
 * @param prisma - PrismaClient instance
 * @param providedUserId - Optional user ID to use for testing
 * @returns Promise<string> - The test user ID
 */
export async function setupTestData(
  prisma: PrismaClient,
  providedUserId?: string
): Promise<string> {
  if (providedUserId) {
    return providedUserId;
  }

  // Find or create a test user
  let testUser = await prisma.user.findFirst({
    where: { email: { startsWith: 'test-performance-' } },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: `test-performance-${Date.now()}@example.com`,
        name: 'Performance Test User',
      },
    });

    // Create some test progress data
    const lessons = await prisma.lesson.findMany({
      take: 10,
      where: { isPublished: true },
    });

    if (lessons.length > 0) {
      await prisma.userProgress.createMany({
        data: lessons.slice(0, 5).map(lesson => ({
          userId: testUser!.id,
          lessonId: lesson.id,
          status: 'completed',
          progressPercentage: 100,
          timeSpentMinutes: Math.floor(Math.random() * 60) + 15,
          completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          lastAccessed: new Date(),
        })),
      });

      await prisma.userProgress.createMany({
        data: lessons.slice(5).map(lesson => ({
          userId: testUser!.id,
          lessonId: lesson.id,
          status: 'in_progress',
          progressPercentage: Math.floor(Math.random() * 80) + 10,
          timeSpentMinutes: Math.floor(Math.random() * 30) + 5,
          lastAccessed: new Date(),
        })),
      });
    }
  }

  return testUser.id;
}
