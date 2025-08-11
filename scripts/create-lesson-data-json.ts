#!/usr/bin/env tsx

import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import * as fs from 'fs';
import * as path from 'path';

interface LessonData {
  lessonNumber: number;
  title: string;
  description: string;
  content: string;
  htmlContent: string;
  tools: string[];
  estimatedTime: number;
  difficultyLevel: string;
  videoUrl?: string;
  videoDuration?: number;
  isFree: boolean;
}

class LessonDataCreator {
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
  async parseLesson(filename: string): Promise<LessonData> {
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
   * Create lessons data JSON
   */
  async createLessonsDataJSON(): Promise<void> {
    console.log('🔄 Creating lessons data JSON...');
    
    const files = this.getLessonFiles();
    const lessons: LessonData[] = [];

    console.log(`📚 Found ${files.length} lesson files to process`);

    for (const file of files) {
      try {
        const lesson = await this.parseLesson(file);
        lessons.push(lesson);
        console.log(`✅ Processed lesson ${lesson.lessonNumber}: ${lesson.title}`);
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error);
      }
    }

    const sortedLessons = lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);

    // Create the JSON structure
    const jsonData = {
      meta: {
        exportDate: new Date().toISOString(),
        totalLessons: sortedLessons.length,
        version: '1.0.0'
      },
      lessons: sortedLessons
    };

    // Write to JSON file
    const filename = `lessons-data-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(jsonData, null, 2));
    
    // Also create a compressed version for API use
    const compressedFilename = `lessons-data-compressed-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(compressedFilename, JSON.stringify(jsonData));

    console.log(`\n✅ JSON export completed!`);
    console.log(`📝 Full JSON file: ${filename}`);
    console.log(`📦 Compressed file: ${compressedFilename}`);
    console.log(`📊 Statistics:`);
    console.log(`  - ${sortedLessons.length} lessons exported`);
    
    // Show difficulty breakdown
    const difficultyBreakdown: Record<string, number> = {};
    sortedLessons.forEach(lesson => {
      difficultyBreakdown[lesson.difficultyLevel] = (difficultyBreakdown[lesson.difficultyLevel] || 0) + 1;
    });
    
    console.log('\n📈 Lessons by Difficulty:');
    Object.entries(difficultyBreakdown).forEach(([difficulty, count]) => {
      console.log(`  ${difficulty}: ${count}`);
    });

    // Show tools breakdown
    const toolsBreakdown: Record<string, number> = {};
    sortedLessons.forEach(lesson => {
      lesson.tools.forEach(tool => {
        toolsBreakdown[tool] = (toolsBreakdown[tool] || 0) + 1;
      });
    });

    console.log('\n🔧 Top AI Tools:');
    const topTools = Object.entries(toolsBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    topTools.forEach(([tool, count]) => {
      console.log(`  ${tool}: ${count} lessons`);
    });
  }
}

async function createLessonDataJSON() {
  const creator = new LessonDataCreator();
  await creator.createLessonsDataJSON();
}

if (require.main === module) {
  createLessonDataJSON().catch(console.error);
}