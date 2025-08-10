// Client-safe stub for content parser
// This file prevents client-side imports of the server-only content parser

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

// Client-side stub that throws helpful error
export class ContentParser {
  constructor() {
    if (typeof window !== 'undefined') {
      throw new Error('ContentParser cannot be used on the client side. Use API endpoints instead.');
    }
  }

  getLessonFiles(): string[] {
    throw new Error('ContentParser methods can only be called on the server side');
  }

  async parseLesson(): Promise<ParsedLesson> {
    throw new Error('ContentParser methods can only be called on the server side');
  }

  async parseAllLessons(): Promise<ParsedLesson[]> {
    throw new Error('ContentParser methods can only be called on the server side');
  }
}

// Client-safe export
export const contentParser = typeof window === 'undefined' 
  ? require('./content-parser').contentParser 
  : new ContentParser();