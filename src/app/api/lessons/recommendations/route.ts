import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';
import type { RecommendationSection, LessonWithMetadata } from '@/types/discovery';

export const dynamic = 'force-dynamic';

// Type definitions for user learning data
interface UserLearningData {
  completedLessons: Array<Prisma.LessonGetPayload<{
    include: {
      categories: {
        include: {
          category: true;
        };
      };
    };
  }>>;
  inProgressLessons: Array<Prisma.LessonGetPayload<true>>;
  bookmarkedLessons: Array<Prisma.LessonGetPayload<{
    include: {
      categories: {
        include: {
          category: true;
        };
      };
    };
  }>>;
  preferredTools: string[];
  preferredCategories: string[];
  completedDifficulties: (string | null)[];
  recentInteractions: Array<Prisma.LessonInteractionGetPayload<{
    include: {
      lesson: {
        include: {
          categories: {
            include: {
              category: true;
            };
          };
        };
      };
    };
  }>>;
}

// Base lesson with includes for queries that have progress and bookmarks
type LessonWithProgressAndBookmarks = Prisma.LessonGetPayload<{
  include: {
    categories: {
      include: {
        category: {
          select: {
            id: true;
            name: true;
            color: true;
            icon: true;
          };
        };
      };
    };
    progress: {
      select: {
        status: true;
        progressPercentage: true;
        completedAt: true;
        lastAccessed: true;
      };
    };
    bookmarks: {
      select: {
        id: true;
      };
    };
    _count: {
      select: {
        interactions: true;
      };
    };
  };
}>;

// Lesson with only categories and count (no progress/bookmarks)
type LessonWithBasicIncludes = Prisma.LessonGetPayload<{
  include: {
    categories: {
      include: {
        category: {
          select: {
            id: true;
            name: true;
            color: true;
            icon: true;
          };
        };
      };
    };
    _count: {
      select: {
        interactions: true;
      };
    };
  };
}>;

// Union type for all lesson variations
type LessonWithIncludes = LessonWithProgressAndBookmarks | LessonWithBasicIncludes;

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.userId;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);

    // Get user's learning data for personalization
    const userLearningData = await getUserLearningData(userId);
    
    // Generate different recommendation sections
    const recommendations = await Promise.all([
      getContinueLearning(userId, limit),
      getRecommendedLessons(userId, userLearningData, limit),
      getTrendingLessons(limit),
      getQuickWins(limit),
      getToolSpecificRecommendations(userId, userLearningData, limit),
    ]);

    const response: RecommendationSection[] = recommendations.filter(section => 
      section.lessons.length > 0
    );

    return NextResponse.json(response);

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.errors.apiError('lesson-recommendations', error as Error, {
      context: 'get_recommendations',
    });

    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

async function getUserLearningData(userId: string): Promise<UserLearningData> {
  const [completedLessons, inProgressLessons, interactions, bookmarks] = await Promise.all([
    // Completed lessons with categories and tools
    prisma.userProgress.findMany({
      where: {
        userId,
        status: 'completed',
      },
      include: {
        lesson: {
          include: {
            categories: {
              include: {
                category: true,
              }
            }
          }
        }
      }
    }),

    // In-progress lessons
    prisma.userProgress.findMany({
      where: {
        userId,
        status: 'in_progress',
      },
      include: {
        lesson: true,
      }
    }),

    // Recent interactions for behavior analysis
    prisma.lessonInteraction.findMany({
      where: {
        userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        lesson: {
          include: {
            categories: {
              include: {
                category: true,
              }
            }
          }
        }
      }
    }),

    // Bookmarked lessons
    prisma.lessonBookmark.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            categories: {
              include: {
                category: true,
              }
            }
          }
        }
      }
    }),
  ]);

  // Extract user preferences
  const completedTools = completedLessons.flatMap(p => p.lesson.tools);
  const completedCategories = completedLessons.flatMap(p => 
    p.lesson.categories.map(c => c.category.name)
  );
  const completedDifficulties = completedLessons.map(p => p.lesson.difficultyLevel).filter(Boolean);

  const interactionTools = interactions.flatMap(i => i.lesson.tools);
  const interactionCategories = interactions.flatMap(i => 
    i.lesson.categories.map(c => c.category.name)
  );

  return {
    completedLessons: completedLessons.map(p => p.lesson),
    inProgressLessons: inProgressLessons.map(p => p.lesson),
    bookmarkedLessons: bookmarks.map(b => b.lesson),
    preferredTools: getMostFrequent([...completedTools, ...interactionTools]),
    preferredCategories: getMostFrequent([...completedCategories, ...interactionCategories]),
    completedDifficulties,
    recentInteractions: interactions.slice(0, 10),
  };
}

async function getContinueLearning(userId: string, limit: number): Promise<RecommendationSection> {
  const inProgressLessons = await prisma.lesson.findMany({
    where: {
      isPublished: true,
      progress: {
        some: {
          userId,
          status: 'in_progress',
        }
      }
    },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            }
          }
        }
      },
      progress: {
        where: { userId },
        select: {
          status: true,
          progressPercentage: true,
          completedAt: true,
          lastAccessed: true,
        }
      },
      bookmarks: {
        where: { userId },
        select: { id: true }
      },
      _count: {
        select: { interactions: true }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: limit,
  });

  return {
    title: 'Continue Learning',
    type: 'continue_learning',
    lessons: transformLessonsToMetadata(inProgressLessons),
  };
}

async function getRecommendedLessons(
  userId: string,
  userData: UserLearningData,
  limit: number
): Promise<RecommendationSection> {
  // Build recommendation based on user preferences
  const whereClause: Prisma.LessonWhereInput = {
    isPublished: true,
    // Exclude already completed lessons
    progress: {
      none: {
        userId,
        status: 'completed',
      }
    }
  };

  // Prefer lessons in user's preferred categories
  if (userData.preferredCategories.length > 0) {
    whereClause.categories = {
      some: {
        category: {
          name: { in: userData.preferredCategories }
        }
      }
    };
  }

  // Prefer lessons with user's preferred tools
  if (userData.preferredTools.length > 0) {
    whereClause.tools = {
      hasSome: userData.preferredTools
    };
  }

  const recommendations = await prisma.lesson.findMany({
    where: whereClause,
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            }
          }
        }
      },
      progress: {
        where: { userId },
        select: {
          status: true,
          progressPercentage: true,
          completedAt: true,
        }
      },
      bookmarks: {
        where: { userId },
        select: { id: true }
      },
      _count: {
        select: { interactions: true }
      }
    },
    orderBy: [
      { lessonNumber: 'asc' }
    ],
    take: limit,
  });

  return {
    title: 'Recommended for You',
    type: 'recommended',
    lessons: transformLessonsToMetadata(recommendations),
  };
}

async function getTrendingLessons(limit: number): Promise<RecommendationSection> {
  // Get lessons with most interactions in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trendingLessons = await prisma.lesson.findMany({
    where: {
      isPublished: true,
      interactions: {
        some: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }
    },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            }
          }
        }
      },
      _count: {
        select: { 
          interactions: {
            where: {
              createdAt: { gte: thirtyDaysAgo }
            }
          }
        }
      }
    },
    orderBy: {
      interactions: {
        _count: 'desc'
      }
    },
    take: limit,
  });

  return {
    title: 'Trending Now',
    type: 'trending',
    lessons: transformLessonsToMetadata(trendingLessons),
  };
}

async function getQuickWins(limit: number): Promise<RecommendationSection> {
  const quickLessons = await prisma.lesson.findMany({
    where: {
      isPublished: true,
      estimatedTime: { lte: 15 }, // 15 minutes or less
    },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            }
          }
        }
      },
      _count: {
        select: { interactions: true }
      }
    },
    orderBy: {
      interactions: {
        _count: 'desc'
      }
    },
    take: limit,
  });

  return {
    title: 'Quick Wins',
    type: 'quick_wins',
    lessons: transformLessonsToMetadata(quickLessons),
  };
}

async function getToolSpecificRecommendations(
  userId: string,
  userData: UserLearningData,
  limit: number
): Promise<RecommendationSection> {
  const topTool = userData.preferredTools[0];
  if (!topTool) {
    return {
      title: 'Master AI Tools',
      type: 'tool_specific',
      lessons: [],
    };
  }

  const toolLessons = await prisma.lesson.findMany({
    where: {
      isPublished: true,
      tools: { has: topTool },
      // Exclude completed lessons
      progress: {
        none: {
          userId,
          status: 'completed',
        }
      }
    },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            }
          }
        }
      },
      progress: {
        where: { userId },
        select: {
          status: true,
          progressPercentage: true,
          completedAt: true,
        }
      },
      bookmarks: {
        where: { userId },
        select: { id: true }
      },
      _count: {
        select: { interactions: true }
      }
    },
    orderBy: { lessonNumber: 'asc' },
    take: limit,
  });

  return {
    title: `Master ${topTool}`,
    type: 'tool_specific',
    lessons: transformLessonsToMetadata(toolLessons),
  };
}

function transformLessonsToMetadata(lessons: LessonWithIncludes[]): LessonWithMetadata[] {
  return lessons.map(lesson => {
    // Type guard to check if lesson has progress and bookmarks
    const hasProgressAndBookmarks = 'progress' in lesson && 'bookmarks' in lesson;

    return {
      id: lesson.id,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      description: lesson.description,
      estimatedTime: lesson.estimatedTime,
      difficultyLevel: lesson.difficultyLevel,
      tools: lesson.tools,
      isFree: lesson.isFree,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      categories: lesson.categories.map((cat) => ({
        id: cat.category.id,
        name: cat.category.name,
        color: cat.category.color,
        icon: cat.category.icon,
      })),
      progress: hasProgressAndBookmarks && lesson.progress?.[0] ? {
        status: lesson.progress[0].status,
        progressPercentage: lesson.progress[0].progressPercentage,
        completedAt: lesson.progress[0].completedAt,
      } : undefined,
      isBookmarked: hasProgressAndBookmarks && lesson.bookmarks ? lesson.bookmarks.length > 0 : false,
      popularity: lesson._count?.interactions || 0,
      completionRate: 75, // TODO: Calculate actual completion rate
      previewContent: lesson.description ?
        lesson.description.substring(0, 200) + (lesson.description.length > 200 ? '...' : '') : '',
    };
  });
}

function getMostFrequent<T>(array: T[]): T[] {
  const frequency: Record<string, number> = {};
  
  array.forEach(item => {
    const key = String(item);
    frequency[key] = (frequency[key] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key as T);
}