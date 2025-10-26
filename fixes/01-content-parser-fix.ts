// Fixed content-parser.ts - Remove hard-coded paths
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import * as fs from 'fs/promises';
import * as path from 'path';

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

  constructor(rootDir?: string) {
    // Use environment variable or relative path
    this.rootDir = rootDir || process.env.CONTENT_ROOT_DIR || path.join(process.cwd(), '..', 'lessons');
  }

  /**
   * Get all lesson files from the root directory
   * @returns Array of lesson filenames
   */
  async getLessonFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.rootDir);
      return files
        .filter(file => file.startsWith('lesson-') && file.endsWith('.md'))
        .sort((a, b) => {
          const numA = this.extractLessonNumber(a);
          const numB = this.extractLessonNumber(b);
          return numA - numB;
        });
    } catch (error) {
      console.error('Error reading lesson files:', error);
      return [];
    }
  }

  /**
   * Extract lesson number from filename
   * @param filename - The lesson filename
   * @returns Lesson number
   */
  private extractLessonNumber(filename: string): number {
    const match = filename.match(/lesson-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Parse a single lesson file
   * @param filename - The lesson filename to parse
   * @returns Parsed lesson data
   */
  async parseLesson(filename: string): Promise<ParsedLesson> {
    const filePath = path.join(this.rootDir, filename);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      
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

      return {
        lessonNumber,
        title,
        description,
        content,
        htmlContent,
        frontmatter,
        tools,
        estimatedTime: frontmatter.estimatedTime || 30,
        difficultyLevel: frontmatter.difficulty || 'beginner',
        videoUrl: frontmatter.videoUrl,
        videoDuration: frontmatter.videoDuration,
        isFree: frontmatter.isFree || false
      };
    } catch (error) {
      throw new Error(`Failed to parse lesson ${filename}: ${error.message}`);
    }
  }

  private extractTitleFromContent(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : 'Untitled Lesson';
  }

  private extractDescriptionFromContent(content: string): string {
    const lines = content.split('\n');
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && line.length > 20) {
        return line;
      }
    }
    return 'No description available';
  }

  private inferTools(filename: string, content: string, frontmatterTools?: string[]): string[] {
    if (frontmatterTools && frontmatterTools.length > 0) {
      return frontmatterTools;
    }

    const tools = new Set<string>();
    const contentLower = content.toLowerCase();
    const filenameLower = filename.toLowerCase();

    const toolPatterns = {
      'ChatGPT': /chatgpt|gpt-4|openai/i,
      'Claude': /claude|anthropic/i,
      'Gemini': /gemini|bard/i,
      'Perplexity': /perplexity/i,
      'DALL-E': /dall-?e|dalle/i,
      'Midjourney': /midjourney/i,
      'Stable Diffusion': /stable.?diffusion/i,
      // Add more patterns as needed
    };

    for (const [tool, pattern] of Object.entries(toolPatterns)) {
      if (pattern.test(contentLower) || pattern.test(filenameLower)) {
        tools.add(tool);
      }
    }

    return Array.from(tools);
  }
}

// Export a singleton instance for server-side use
export const contentParser = new ContentParser();
