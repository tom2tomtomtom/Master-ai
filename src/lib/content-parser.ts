import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
// Only import fs on server side
const fs = typeof window === 'undefined' ? require('fs') : null;
const path = typeof window === 'undefined' ? require('path') : null;

export interface LessonFrontmatter {
  title?: string;
  description?: string;
  difficulty?: string;
  estimatedTime?: number;
  tools?: string[];
  videoUrl?: string;
  videoDuration?: number;
  isFree?: boolean;
}

export interface ParsedLesson {
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

export class ContentParser {
  private rootDir: string;

  constructor(rootDir: string = '/Users/thomasdowuona-hyde/Master-AI') {
    this.rootDir = rootDir;
  }

  /**
   * Get all lesson files from the root directory
   */
  getLessonFiles(): string[] {
    // Only run on server side
    if (typeof window !== 'undefined' || !fs) {
      return [];
    }
    
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
    // Only run on server side
    if (typeof window !== 'undefined' || !fs || !path) {
      throw new Error('parseLesson can only be called on the server side');
    }
    
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
   * Parse all lesson files
   */
  async parseAllLessons(): Promise<ParsedLesson[]> {
    // Only run on server side
    if (typeof window !== 'undefined' || !fs) {
      return [];
    }
    
    const files = this.getLessonFiles();
    const lessons: ParsedLesson[] = [];

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
   * Extract description from content (italic text after title or problem section)
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

    // Infer from lesson number and complexity indicators
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
   * Get learning path categories based on content analysis
   */
  getLearningPathCategories(lessons: ParsedLesson[]): Map<string, ParsedLesson[]> {
    const categories = new Map<string, ParsedLesson[]>();

    for (const lesson of lessons) {
      const category = this.categorizeLesson(lesson);
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(lesson);
    }

    return categories;
  }

  /**
   * Categorize a lesson into a learning path
   */
  private categorizeLesson(lesson: ParsedLesson): string {
    const { title, tools, lessonNumber } = lesson;
    const lowerTitle = title.toLowerCase();

    // Text & Research AI Tools
    if (tools.some(tool => ['ChatGPT', 'Claude', 'Gemini', 'Perplexity'].includes(tool))) {
      if (lessonNumber <= 27) {
        return 'Text & Research AI Mastery';
      }
    }

    // Visual AI Tools
    if (tools.some(tool => ['DALL-E', 'Midjourney', 'Stable Diffusion'].includes(tool))) {
      return 'Visual AI Creation';
    }

    // Video & Audio AI
    if (tools.some(tool => ['RunwayML', 'ElevenLabs', 'Suno AI', 'Pika Labs'].includes(tool))) {
      return 'Video & Audio AI';
    }

    // Productivity & Workflow AI
    if (tools.some(tool => ['Notion AI', 'Microsoft Copilot', 'Slack AI', 'NotebookLM'].includes(tool)) ||
        lowerTitle.includes('workflow') || lowerTitle.includes('productivity')) {
      return 'AI-Powered Productivity';
    }

    // Automation & Integration
    if (tools.some(tool => ['Zapier', 'N8N', 'Power Automate'].includes(tool)) ||
        lowerTitle.includes('automation') || lowerTitle.includes('integration')) {
      return 'AI Automation & Integration';
    }

    // Development & Code AI
    if (tools.some(tool => ['Cursor', 'Lovable', 'V0'].includes(tool)) ||
        lowerTitle.includes('code') || lowerTitle.includes('development')) {
      return 'AI-Assisted Development';
    }

    // Business & Strategy
    if (lowerTitle.includes('business') || lowerTitle.includes('enterprise') || 
        lowerTitle.includes('strategy') || lowerTitle.includes('roi') ||
        lowerTitle.includes('governance') || lowerTitle.includes('ethics')) {
      return 'AI Business Strategy';
    }

    // Advanced Topics
    if (lessonNumber >= 70 || lowerTitle.includes('advanced') || lowerTitle.includes('mastery')) {
      return 'Advanced AI Implementation';
    }

    // Default fallback
    return 'Core AI Fundamentals';
  }
}

export const contentParser = new ContentParser();