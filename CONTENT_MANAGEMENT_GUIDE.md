# Master AI Content Management System

A comprehensive content management system for importing and managing educational lesson content from markdown files into a PostgreSQL database using Prisma.

## 🎯 Overview

This system provides:
- **Content Parser**: Extracts frontmatter and parses 88 markdown lesson files
- **Database Import**: Batch imports lessons into Prisma database
- **Learning Path Creator**: Auto-organizes lessons into 8 logical learning paths
- **Content Management API**: RESTful API for CRUD operations
- **Admin Interface**: Web-based content management dashboard

## 📊 Content Statistics

- **88 Total Lessons** covering AI tools and techniques
- **8 Learning Paths** organized by category and difficulty
- **22+ AI Tools** covered across lessons
- **3 Difficulty Levels**: Beginner, Intermediate, Advanced
- **Auto-categorization** based on content analysis

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database
3. **Environment Variables** configured

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other settings
   ```

3. **Setup Database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Validate Content**
   ```bash
   npm run validate-content
   ```

5. **Import Content**
   ```bash
   npm run import-content
   ```

## 📝 Available Scripts

### Content Management
- `npm run validate-content` - Validate all lesson files
- `npm run import-content` - Import all lessons and learning paths
- `npm run import-content:clear` - Clear existing data and import fresh

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## 🗂️ Learning Path Categories

The system automatically organizes lessons into these learning paths:

### 1. Text & Research AI Mastery (28 lessons)
- **Focus**: ChatGPT, Claude, Gemini, Perplexity
- **Difficulty**: Beginner to Advanced
- **Target**: Professionals, Researchers, Content Creators

### 2. Visual AI Creation (18 lessons)
- **Focus**: DALL-E, Midjourney, Stable Diffusion
- **Difficulty**: Intermediate
- **Target**: Designers, Marketers, Creative Professionals

### 3. Core AI Fundamentals (10 lessons)
- **Focus**: AI basics, tool selection, foundational concepts
- **Difficulty**: Beginner
- **Target**: AI newcomers, general professionals

### 4. AI-Powered Productivity (7 lessons)
- **Focus**: Notion AI, Microsoft Copilot, Google Workspace
- **Difficulty**: Beginner
- **Target**: Business Professionals, Teams, Managers

### 5. AI Automation & Integration (6 lessons)
- **Focus**: Zapier, N8N, Power Automate
- **Difficulty**: Advanced
- **Target**: Operations Teams, Power Users, Entrepreneurs

### 6. Video & Audio AI (6 lessons)
- **Focus**: RunwayML, ElevenLabs, Suno AI, Pika Labs
- **Difficulty**: Intermediate
- **Target**: Content Creators, Media Professionals

### 7. AI Business Strategy (5 lessons)
- **Focus**: Ethics, ROI, governance, change management
- **Difficulty**: Advanced
- **Target**: Executives, Business Leaders, Consultants

### 8. AI-Assisted Development (4 lessons)
- **Focus**: Cursor, Lovable, V0, Claude Computer Use
- **Difficulty**: Intermediate
- **Target**: Developers, Engineers, Technical Teams

## 🔧 System Architecture

### Content Parser (`src/lib/content-parser.ts`)
- Reads markdown files from root directory
- Extracts frontmatter metadata
- Converts markdown to HTML
- Infers missing metadata (tools, difficulty, etc.)
- Categorizes lessons for learning paths

### Content Importer (`src/lib/content-importer.ts`)
- Batch imports lessons to database
- Creates learning path associations
- Handles updates and conflicts
- Provides import statistics

### API Routes (`src/app/api/`)
- **Lessons**: `/api/lessons` - CRUD operations for lessons
- **Learning Paths**: `/api/learning-paths` - Manage learning paths
- **Admin**: `/api/admin/content` - Content management operations

### Admin Interface (`src/app/admin/page.tsx`)
- Web-based content management
- Import/validation controls
- Real-time statistics
- Issue reporting

## 📚 Database Schema

### Core Models
- **Lesson**: Stores lesson content and metadata
- **LearningPath**: Defines learning path information
- **LearningPathLesson**: Associates lessons with paths
- **User**: User management and authentication
- **UserProgress**: Tracks learning progress

### Key Fields
```typescript
Lesson {
  lessonNumber: Int
  title: String
  description: String
  content: String (markdown)
  tools: String[]
  difficultyLevel: String
  estimatedTime: Int
  isPublished: Boolean
  isFree: Boolean
}
```

## 🎨 Content Format

### Lesson File Structure
```
lesson-XX-topic-name.md
```

### Expected Content Format
```markdown
# Lesson X: Title - Subtitle

*Brief description in italics*

---

## The Problem Many professionals find

Content describing the problem...

**What You'll Save**: Time savings
**What You'll Gain**: Benefits
**What You'll Need**: Requirements

---

## Quick Setup (3 minutes)

Setup instructions...
```

### Frontmatter Support (Optional)
```yaml
---
title: "Lesson Title"
description: "Lesson description"
difficulty: "beginner|intermediate|advanced"
estimatedTime: 30
tools: ["ChatGPT", "Claude"]
videoUrl: "https://..."
videoDuration: 1800
isFree: true
---
```

## 🔍 Content Validation

The validation system checks for:

### Errors (Must Fix)
- Missing or invalid titles
- Duplicate lesson numbers
- File parsing errors

### Warnings (Should Fix)
- Missing descriptions
- Very short content
- Missing video information

### Info (Optional)
- No AI tools detected
- Unusual content patterns

## 🚀 Import Process

### 1. Validation Phase
- Parse all lesson files
- Check for errors and warnings
- Validate content structure

### 2. Import Phase
- Create/update lessons in database
- Create learning paths
- Associate lessons with paths
- Generate statistics

### 3. Verification Phase
- Confirm import success
- Display import statistics
- Report any issues

## 🎯 Admin Dashboard Features

### Content Actions
- **Import All Content**: Full content import
- **Preview Import**: Preview without database changes
- **Validate Files**: Check for issues before import
- **Refresh Stats**: Update statistics display

### Statistics Dashboard
- Database content overview
- File parsing statistics
- Difficulty distribution
- AI tool coverage
- Learning path breakdown

### Issue Reporting
- Real-time validation results
- Color-coded issue severity
- Detailed error descriptions
- Resolution guidance

## 🔒 Security Considerations

### Database Security
- Use environment variables for credentials
- Implement proper database permissions
- Regular backup procedures

### API Security
- Authentication for admin routes
- Input validation and sanitization
- Rate limiting for public APIs

### Content Security
- Markdown sanitization
- File path validation
- Content filtering for malicious code

## 🚀 Production Deployment

### Environment Setup
1. Configure production database
2. Set secure environment variables
3. Enable proper logging
4. Configure backup procedures

### Performance Optimization
- Database indexing for common queries
- Content caching strategies
- API response optimization
- Static asset optimization

### Monitoring
- Import process logging
- Error tracking and alerting
- Performance monitoring
- User analytics

## 🛠️ Troubleshooting

### Common Issues

#### Import Fails
- Check database connection
- Verify environment variables
- Ensure write permissions
- Check disk space

#### Validation Errors
- Fix markdown syntax errors
- Ensure proper file naming
- Check content structure
- Verify required fields

#### Performance Issues
- Monitor database queries
- Check content file sizes
- Optimize parsing logic
- Consider batch processing

### Debug Commands
```bash
# Check content parsing
npm run validate-content

# Test database connection
npx prisma db pull

# View import logs
npm run import-content 2>&1 | tee import.log

# Reset database (CAUTION!)
npx prisma migrate reset
```

## 📈 Future Enhancements

### Planned Features
- **Content Versioning**: Track content changes over time
- **Bulk Content Editor**: Web-based content editing
- **Advanced Analytics**: Detailed usage statistics
- **Content Templates**: Standardized lesson templates
- **Export Functions**: Content export to various formats

### Integration Opportunities
- **LMS Integration**: Connect with learning management systems
- **Analytics Platforms**: Advanced learning analytics
- **Content Delivery**: CDN integration for better performance
- **Mobile Apps**: Native mobile app integration

## 🤝 Contributing

### Development Workflow
1. Validate content changes
2. Test import process
3. Update documentation
4. Submit pull request

### Code Standards
- TypeScript strict mode
- Comprehensive error handling
- Detailed logging
- Unit test coverage

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting guide
2. Review validation output
3. Check system logs
4. Create detailed issue reports

---

*Built with Next.js, TypeScript, Prisma, and PostgreSQL*
*Content Management System for Master AI Educational Platform*