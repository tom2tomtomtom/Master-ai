import { PrismaClient, Lesson, LearningPath } from '@prisma/client';

import { contentParser, ParsedLesson } from './content-parser';

const prisma = new PrismaClient();

export interface LearningPathConfig {
  name: string;
  description: string;
  targetAudience: string;
  estimatedHours: number;
  difficultyLevel: string;
  color: string;
  icon: string;
  order: number;
}

export class ContentImporter {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Import all lessons and create learning paths
   */
  async importAllContent(): Promise<void> {
    try {
      // 1. Parse all lessons
      const lessons = await contentParser.parseAllLessons();

      // 2. Clear existing data (optional - be careful!)
      // await this.clearExistingData();

      // 3. Import lessons
      const importedLessons = await this.importLessons(lessons);

      // 4. Create learning paths
      const learningPaths = await this.createLearningPaths(importedLessons);

      // 5. Associate lessons with learning paths
      await this.associateLessonsWithPaths(importedLessons, learningPaths);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Import lessons to database
   */
  private async importLessons(parsedLessons: ParsedLesson[]): Promise<Lesson[]> {
    const importedLessons = [];

    for (const lesson of parsedLessons) {
      try {
        // Check if lesson already exists
        const existingLesson = await this.prisma.lesson.findUnique({
          where: { lessonNumber: lesson.lessonNumber }
        });

        let importedLesson;
        if (existingLesson) {
          // Update existing lesson
          importedLesson = await this.prisma.lesson.update({
            where: { lessonNumber: lesson.lessonNumber },
            data: {
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              videoUrl: lesson.videoUrl,
              videoDuration: lesson.videoDuration,
              estimatedTime: lesson.estimatedTime,
              difficultyLevel: lesson.difficultyLevel,
              tools: lesson.tools,
              isPublished: true,
              isFree: lesson.isFree,
            }
          });
        } else {
          // Create new lesson
          importedLesson = await this.prisma.lesson.create({
            data: {
              lessonNumber: lesson.lessonNumber,
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              videoUrl: lesson.videoUrl,
              videoDuration: lesson.videoDuration,
              estimatedTime: lesson.estimatedTime,
              difficultyLevel: lesson.difficultyLevel,
              tools: lesson.tools,
              isPublished: true,
              isFree: lesson.isFree,
            }
          });
        }

        importedLessons.push(importedLesson);
      } catch (error) {
        // Continue with other lessons if one fails
        continue;
      }
    }

    return importedLessons;
  }

  /**
   * Create learning paths based on categorized lessons
   */
  private async createLearningPaths(_lessons: Lesson[]): Promise<LearningPath[]> {
    const learningPathConfigs: LearningPathConfig[] = [
      {
        name: 'Text & Research AI Mastery',
        description: 'Master ChatGPT, Claude, Gemini, and Perplexity for advanced text generation and research tasks',
        targetAudience: 'Professionals, Researchers, Content Creators',
        estimatedHours: 25,
        difficultyLevel: 'beginner',
        color: '#3B82F6',
        icon: '💬',
        order: 1,
      },
      {
        name: 'Visual AI Creation',
        description: 'Create stunning visuals with DALL-E, Midjourney, and Stable Diffusion',
        targetAudience: 'Designers, Marketers, Creative Professionals',
        estimatedHours: 15,
        difficultyLevel: 'intermediate',
        color: '#8B5CF6',
        icon: '🎨',
        order: 2,
      },
      {
        name: 'Video & Audio AI',
        description: 'Generate professional videos and audio content with cutting-edge AI tools',
        targetAudience: 'Content Creators, Marketers, Media Professionals',
        estimatedHours: 12,
        difficultyLevel: 'intermediate',
        color: '#EF4444',
        icon: '🎬',
        order: 3,
      },
      {
        name: 'AI-Powered Productivity',
        description: 'Supercharge your workflow with AI-enhanced productivity tools',
        targetAudience: 'Business Professionals, Teams, Managers',
        estimatedHours: 18,
        difficultyLevel: 'beginner',
        color: '#10B981',
        icon: '⚡',
        order: 4,
      },
      {
        name: 'AI Automation & Integration',
        description: 'Build powerful automated workflows that connect your favorite tools',
        targetAudience: 'Operations Teams, Power Users, Entrepreneurs',
        estimatedHours: 20,
        difficultyLevel: 'advanced',
        color: '#F59E0B',
        icon: '🔗',
        order: 5,
      },
      {
        name: 'AI-Assisted Development',
        description: 'Accelerate your development process with AI coding assistants',
        targetAudience: 'Developers, Engineers, Technical Teams',
        estimatedHours: 10,
        difficultyLevel: 'intermediate',
        color: '#06B6D4',
        icon: '💻',
        order: 6,
      },
      {
        name: 'AI Business Strategy',
        description: 'Implement AI strategically across your organization for maximum ROI',
        targetAudience: 'Executives, Business Leaders, Consultants',
        estimatedHours: 22,
        difficultyLevel: 'advanced',
        color: '#DC2626',
        icon: '📊',
        order: 7,
      },
      {
        name: 'Advanced AI Implementation',
        description: 'Master complex AI implementations and become an AI transformation leader',
        targetAudience: 'AI Specialists, Senior Professionals, Innovation Leaders',
        estimatedHours: 30,
        difficultyLevel: 'expert',
        color: '#7C3AED',
        icon: '🚀',
        order: 8,
      },
    ];

    const createdPaths = [];

    for (const config of learningPathConfigs) {
      try {
        // Check if learning path already exists
        const existingPath = await this.prisma.learningPath.findFirst({
          where: { name: config.name }
        });

        let learningPath;
        if (existingPath) {
          // Update existing path
          learningPath = await this.prisma.learningPath.update({
            where: { id: existingPath.id },
            data: {
              description: config.description,
              targetAudience: config.targetAudience,
              estimatedHours: config.estimatedHours,
              difficultyLevel: config.difficultyLevel,
              color: config.color,
              icon: config.icon,
              order: config.order,
            }
          });
        } else {
          // Create new path
          learningPath = await this.prisma.learningPath.create({
            data: config
          });
        }

        createdPaths.push(learningPath);
      } catch (error) {
        // Continue with other paths if one fails
        continue;
      }
    }

    return createdPaths;
  }

  /**
   * Associate lessons with learning paths based on content analysis
   */
  private async associateLessonsWithPaths(lessons: Lesson[], learningPaths: LearningPath[]): Promise<void> {
    // Get categorized lessons from content parser
    const parsedLessons = await contentParser.parseAllLessons();
    const categories = contentParser.getLearningPathCategories(parsedLessons);

    for (const learningPath of learningPaths) {
      const categoryLessons = categories.get(learningPath.name) || [];
      
      for (let i = 0; i < categoryLessons.length; i++) {
        const categoryLesson = categoryLessons[i];
        const dbLesson = lessons.find(l => l.lessonNumber === categoryLesson.lessonNumber);
        
        if (dbLesson) {
          try {
            // Check if association already exists
            const existingAssociation = await this.prisma.learningPathLesson.findUnique({
              where: {
                learningPathId_lessonId: {
                  learningPathId: learningPath.id,
                  lessonId: dbLesson.id,
                }
              }
            });

            if (!existingAssociation) {
              await this.prisma.learningPathLesson.create({
                data: {
                  learningPathId: learningPath.id,
                  lessonId: dbLesson.id,
                  order: i + 1,
                  isRequired: true,
                }
              });
            }
          } catch (error) {
            // Continue with other associations if one fails
            continue;
          }
        }
      }
    }
  }

  /**
   * Clear existing data (use with caution!)
   */
  private async clearExistingData(): Promise<void> {
    await this.prisma.learningPathLesson.deleteMany();
    await this.prisma.userProgress.deleteMany();
    await this.prisma.lessonNote.deleteMany();
    await this.prisma.lessonBookmark.deleteMany();
    await this.prisma.exercise.deleteMany();
    await this.prisma.lesson.deleteMany();
    await this.prisma.learningPath.deleteMany();
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{
    totalLessons: number;
    totalLearningPaths: number;
    lessonsByDifficulty: Record<string, number>;
    lessonsByTool: Record<string, number>;
  }> {
    const totalLessons = await this.prisma.lesson.count();
    const totalLearningPaths = await this.prisma.learningPath.count();
    
    const lessons = await this.prisma.lesson.findMany({
      select: { difficultyLevel: true, tools: true }
    });

    const lessonsByDifficulty: Record<string, number> = {};
    const lessonsByTool: Record<string, number> = {};

    for (const lesson of lessons) {
      // Count by difficulty
      const difficulty = lesson.difficultyLevel || 'unknown';
      lessonsByDifficulty[difficulty] = (lessonsByDifficulty[difficulty] || 0) + 1;

      // Count by tools
      for (const tool of lesson.tools) {
        lessonsByTool[tool] = (lessonsByTool[tool] || 0) + 1;
      }
    }

    return {
      totalLessons,
      totalLearningPaths,
      lessonsByDifficulty,
      lessonsByTool,
    };
  }

  /**
   * Cleanup database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const contentImporter = new ContentImporter();