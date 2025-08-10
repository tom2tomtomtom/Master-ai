import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/supabase-auth-middleware';
import { PrismaClient } from '@prisma/client';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/admin/stats - Get platform statistics (admin only)
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();

    // Get comprehensive platform statistics
    const [
      totalUsers,
      usersByRole,
      totalLessons,
      totalCertifications,
      totalAchievements,
      recentUsers,
      userActivity,
      subscriptionStats
    ] = await Promise.all([
      // Total user count
      prisma.user.count(),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      
      // Content statistics
      prisma.lesson.count({ where: { isPublished: true } }),
      prisma.certification.count({ where: { isActive: true } }),
      prisma.achievement.count({ where: { isActive: true } }),
      
      // Recent user registrations (last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // User activity stats
      prisma.userProgress.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Subscription statistics
      prisma.user.groupBy({
        by: ['subscriptionTier'],
        _count: { subscriptionTier: true }
      })
    ]);

    // Get top performing users
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        stats: {
          select: {
            totalLessonsCompleted: true,
            totalPointsEarned: true,
            currentStreak: true
          }
        }
      },
      where: {
        stats: {
          totalLessonsCompleted: { gt: 0 }
        }
      },
      orderBy: {
        stats: {
          totalPointsEarned: 'desc'
        }
      },
      take: 10
    });

    // Get recent certifications awarded
    const recentCertifications = await prisma.userCertification.findMany({
      where: {
        earnedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        },
        isRevoked: false
      },
      include: {
        user: {
          select: { email: true, name: true }
        },
        certification: {
          select: { name: true, type: true }
        }
      },
      orderBy: { earnedAt: 'desc' },
      take: 20
    });

    // Calculate growth metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [usersLast30Days, usersPrevious30Days] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      })
    ]);

    const userGrowthRate = usersPrevious30Days > 0 
      ? ((usersLast30Days - usersPrevious30Days) / usersPrevious30Days) * 100 
      : 0;

    return NextResponse.json({
      overview: {
        totalUsers,
        totalLessons,
        totalCertifications,
        totalAchievements,
        recentUsers,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100
      },
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
      userActivity: userActivity.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      subscriptionStats: subscriptionStats.reduce((acc, item) => {
        acc[item.subscriptionTier] = item._count.subscriptionTier;
        return acc;
      }, {} as Record<string, number>),
      topUsers: topUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        lessonsCompleted: user.stats?.totalLessonsCompleted || 0,
        pointsEarned: user.stats?.totalPointsEarned || 0,
        currentStreak: user.stats?.currentStreak || 0
      })),
      recentActivity: {
        certifications: recentCertifications.map(cert => ({
          id: cert.id,
          certificationName: cert.certification.name,
          certificationType: cert.certification.type,
          userEmail: cert.user.email,
          userName: cert.user.name,
          earnedAt: cert.earnedAt
        }))
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: 'Failed to fetch platform statistics' },
      { status: 500 }
    );
  }
}