#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import * as fs from 'fs';
import * as path from 'path';

// Production environment variables (remove newlines)
const cleanEnvVar = (value: string | undefined): string => {
  return value?.replace(/\\n/g, '').trim() || '';
};

// Get production database URL
const productionDatabaseUrl = process.env.VERCEL_ENV === 'production' 
  ? cleanEnvVar(process.env.DATABASE_URL)
  : cleanEnvVar(process.env.DIRECT_DATABASE_URL) || cleanEnvVar(process.env.DATABASE_URL);

console.log('🔗 Using database URL:', productionDatabaseUrl ? 'Connected' : 'Not configured');

// Initialize Prisma with production database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: productionDatabaseUrl
    }
  },
  log: ['info', 'warn', 'error']
});

interface LessonFrontmatter {
  title?: string;
  description?: string;
  difficulty?: string;
  estimatedTime?: number;
  tools?: string[];
  videoUrl?: string;
  videoDuration?: number;
  isFree?: boolean;
}

interface ParsedLesson {
  lessonNumber: number;
  title: string;
  description: string;
  content: string;
  htmlContent: string;
  frontmatter: LessonFrontmatter;
  tools: string[];
  estimatedTime: number;
  difficultyLevel: string;
  videoUrl?: string;
  videoDuration?: number;
  isFree: boolean;
}

class ProductionContentImporter {
  private rootDir: string;

  constructor(rootDir: string = '/Users/thomasdowuona-hyde/Master-AI') {
    this.rootDir = rootDir;
  }

  /**
   * Get all lesson files from the root directory
   */
  getLessonFiles(): string[] {
    const files = fs.readdirSync(this.rootDir);
    return files
      .filter(file => file.startsWith('lesson-') && file.endsWith('.md'))
      .sort((a, b) => {
        const numA = this.extractLessonNumber(a);
        const numB = this.extractLessonNumber(b);
        return numA - numB;
      });
  }

  /**
   * Extract lesson number from filename
   */
  private extractLessonNumber(filename: string): number {
    const match = filename.match(/lesson-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Parse a single lesson file
   */
  async parseLesson(filename: string): Promise<ParsedLesson> {
    const filePath = path.join(this.rootDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse frontmatter and content
    const { data: frontmatter, content } = matter(fileContent);
    
    // Convert markdown to HTML
    const processedContent = await remark()
      .use(html, { sanitize: false })
      .process(content);
    const htmlContent = processedContent.toString();

    // Extract lesson number from filename
    const lessonNumber = this.extractLessonNumber(filename);

    // Extract title from content if not in frontmatter
    const title = frontmatter.title || this.extractTitleFromContent(content);
    
    // Extract description from content if not in frontmatter
    const description = frontmatter.description || this.extractDescriptionFromContent(content);

    // Infer tools from content and filename
    const tools = this.inferTools(filename, content, frontmatter.tools);

    // Infer difficulty level
    const difficultyLevel = this.inferDifficulty(filename, content, frontmatter.difficulty);

    // Estimate reading time if not provided
    const estimatedTime = frontmatter.estimatedTime || this.estimateReadingTime(content);

    return {
      lessonNumber,
      title,
      description,
      content,
      htmlContent,
      frontmatter: frontmatter as LessonFrontmatter,
      tools,
      estimatedTime,
      difficultyLevel,
      videoUrl: frontmatter.videoUrl,
      videoDuration: frontmatter.videoDuration,
      isFree: frontmatter.isFree ?? (lessonNumber <= 5), // First 5 lessons are free by default
    };
  }

  /**
   * Extract title from content (first h1)
   */
  private extractTitleFromContent(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    // Fallback: look for title pattern "Lesson X: Title"
    const lessonTitleMatch = content.match(/^#\s+Lesson\s+\d+:\s+(.+)$/m);
    if (lessonTitleMatch) {
      return lessonTitleMatch[1].trim();
    }

    return 'Untitled Lesson';
  }

  /**
   * Extract description from content
   */
  private extractDescriptionFromContent(content: string): string {
    // Look for italic text right after the title
    const descMatch = content.match(/^#[^\n]+\n\n\*([^*]+)\*/m);
    if (descMatch) {
      return descMatch[1].trim();
    }

    // Look for description in "The Problem" section
    const problemMatch = content.match(/## The Problem[^#]*?([^\n]+)/);
    if (problemMatch) {
      return problemMatch[1].trim().substring(0, 200) + '...';
    }

    // Fallback: first paragraph
    const firstParagraph = content.split('\n\n').find(p => 
      p.trim() && !p.startsWith('#') && !p.startsWith('*') && !p.startsWith('-')
    );

    return firstParagraph ? firstParagraph.substring(0, 200) + '...' : 'No description available';
  }

  /**
   * Infer AI tools from filename and content
   */
  private inferTools(filename: string, content: string, explicitTools?: string[]): string[] {
    if (explicitTools && explicitTools.length > 0) {
      return explicitTools;
    }

    const tools = new Set<string>();
    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Tool detection patterns
    const toolPatterns = {
      'ChatGPT': ['chatgpt', 'chat gpt', 'gpt-4', 'gpt-3'],
      'Claude': ['claude', 'anthropic'],
      'Gemini': ['gemini', 'google ai', 'bard'],
      'Perplexity': ['perplexity'],
      'DALL-E': ['dalle', 'dall-e', 'dall·e'],
      'Midjourney': ['midjourney'],
      'Stable Diffusion': ['stable diffusion'],
      'RunwayML': ['runway', 'runwayml'],
      'ElevenLabs': ['elevenlabs', 'eleven labs'],
      'NotebookLM': ['notebooklm'],
      'Notion AI': ['notion ai'],
      'Microsoft Copilot': ['copilot', 'microsoft copilot'],
      'Slack AI': ['slack ai'],
      'Zapier': ['zapier'],
      'N8N': ['n8n'],
      'Power Automate': ['power automate'],
      'Cursor': ['cursor'],
      'Lovable': ['lovable'],
      'V0': ['v0'],
      'Suno AI': ['suno'],
      'Pika Labs': ['pika labs', 'pika'],
    };

    for (const [tool, patterns] of Object.entries(toolPatterns)) {
      for (const pattern of patterns) {
        if (lowerFilename.includes(pattern) || lowerContent.includes(pattern)) {
          tools.add(tool);
          break;
        }
      }
    }

    return Array.from(tools);
  }

  /**
   * Infer difficulty level from content and lesson number
   */
  private inferDifficulty(filename: string, content: string, explicitDifficulty?: string): string {
    if (explicitDifficulty) {
      return explicitDifficulty;
    }

    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Check for explicit difficulty markers
    if (lowerFilename.includes('beginner') || lowerContent.includes('beginner')) {
      return 'beginner';
    }
    if (lowerFilename.includes('intermediate') || lowerContent.includes('intermediate')) {
      return 'intermediate';
    }
    if (lowerFilename.includes('advanced') || lowerContent.includes('advanced')) {
      return 'advanced';
    }

    // Infer from lesson number
    const lessonNumber = this.extractLessonNumber(filename);
    
    if (lessonNumber <= 20) {
      return 'beginner';
    } else if (lessonNumber <= 60) {
      return 'intermediate';
    } else {
      return 'advanced';
    }
  }

  /**
   * Estimate reading time based on word count
   */
  private estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  /**
   * Parse all lesson files
   */
  async parseAllLessons(): Promise<ParsedLesson[]> {
    const files = this.getLessonFiles();
    const lessons: ParsedLesson[] = [];

    console.log(`\n📚 Found ${files.length} lesson files to process`);

    for (const file of files) {
      try {
        const lesson = await this.parseLesson(file);
        lessons.push(lesson);
        console.log(`✅ Parsed lesson ${lesson.lessonNumber}: ${lesson.title}`);
      } catch (error) {
        console.error(`❌ Error parsing ${file}:`, error);
      }
    }

    return lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
  }

  /**
   * Import lessons to production database
   */
  async importLessons(parsedLessons: ParsedLesson[]): Promise<any[]> {
    const importedLessons = [];
    let successCount = 0;
    let errorCount = 0;

    console.log(`\n🚀 Starting import of ${parsedLessons.length} lessons to production database...`);

    for (const lesson of parsedLessons) {
      try {
        // Check if lesson already exists
        const existingLesson = await prisma.lesson.findUnique({
          where: { lessonNumber: lesson.lessonNumber }
        });

        let importedLesson;
        if (existingLesson) {
          // Update existing lesson
          importedLesson = await prisma.lesson.update({
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
          console.log(`📝 Updated lesson ${lesson.lessonNumber}: ${lesson.title}`);
        } else {
          // Create new lesson
          importedLesson = await prisma.lesson.create({
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
          console.log(`✨ Created lesson ${lesson.lessonNumber}: ${lesson.title}`);
        }

        importedLessons.push(importedLesson);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to import lesson ${lesson.lessonNumber}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Import Results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📚 Total processed: ${parsedLessons.length}`);

    return importedLessons;
  }

  /**
   * Create learning paths
   */
  async createLearningPaths(): Promise<any[]> {
    const learningPathConfigs = [
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

    console.log(`\n🛤️ Creating ${learningPathConfigs.length} learning paths...`);

    for (const config of learningPathConfigs) {
      try {
        // Check if learning path already exists
        const existingPath = await prisma.learningPath.findFirst({
          where: { name: config.name }
        });

        let learningPath;
        if (existingPath) {
          // Update existing path
          learningPath = await prisma.learningPath.update({
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
          console.log(`📝 Updated learning path: ${config.name}`);
        } else {
          // Create new path
          learningPath = await prisma.learningPath.create({
            data: config
          });
          console.log(`✨ Created learning path: ${config.name}`);
        }

        createdPaths.push(learningPath);
      } catch (error) {
        console.error(`❌ Failed to create learning path ${config.name}:`, error);
      }
    }

    return createdPaths;
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
    const totalLessons = await prisma.lesson.count();
    const totalLearningPaths = await prisma.learningPath.count();
    
    const lessons = await prisma.lesson.findMany({
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
}

/**
 * Main import function
 */
export async function importProductionContent() {
  console.log('🎓 Master AI Production Content Importer');
  console.log('==========================================');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  
  if (!productionDatabaseUrl) {
    console.error('❌ No production database URL found. Please check environment variables.');
    process.exit(1);
  }

  const importer = new ProductionContentImporter();

  try {
    console.time('⏱️ Total import time');
    
    // Test database connection
    console.log('\n🔗 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // 1. Parse all lessons
    console.log('\n📖 Phase 1: Parsing lesson files...');
    const lessons = await importer.parseAllLessons();
    
    if (lessons.length === 0) {
      console.error('❌ No lessons found to import. Check the lesson files directory.');
      process.exit(1);
    }

    // 2. Import lessons
    console.log('\n📚 Phase 2: Importing lessons to database...');
    const importedLessons = await importer.importLessons(lessons);

    // 3. Create learning paths
    console.log('\n🛤️ Phase 3: Creating learning paths...');
    await importer.createLearningPaths();

    // 4. Show import statistics
    console.log('\n📊 Import Statistics:');
    console.log('=====================');
    
    const stats = await importer.getImportStats();
    console.log(`📚 Total Lessons: ${stats.totalLessons}`);
    console.log(`🛤️ Total Learning Paths: ${stats.totalLearningPaths}`);
    
    console.log('\n📈 Lessons by Difficulty:');
    Object.entries(stats.lessonsByDifficulty).forEach(([difficulty, count]) => {
      console.log(`  ${difficulty}: ${count}`);
    });
    
    console.log('\n🔧 Top AI Tools:');
    const topTools = Object.entries(stats.lessonsByTool)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    topTools.forEach(([tool, count]) => {
      console.log(`  ${tool}: ${count} lessons`);
    });
    
    console.timeEnd('⏱️ Total import time');
    console.log(`\n🎉 Production import completed successfully!`);
    console.log(`📅 Finished at: ${new Date().toISOString()}`);
    console.log(`✨ Your Master AI production database is now ready with ${importedLessons.length} lessons!`);
    
  } catch (error) {
    console.error('\n💥 Production import failed:', error);
    
    // Additional error context
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Import cancelled by user');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n👋 Import terminated');
  await prisma.$disconnect();
  process.exit(0);
});

if (require.main === module) {
  importProductionContent().catch(console.error);
}