# Master AI SaaS Platform

A comprehensive Next.js/TypeScript educational SaaS platform with advanced content management for AI learning courses.

## 🚀 Quick Start

### 1. Setup
```bash
npm run setup
```

### 2. Configure Database
Edit `.env` file with your Supabase configuration:
```env
DATABASE_URL="postgresql://postgres:your-password@your-project-ref.supabase.co:5432/postgres"
DIRECT_DATABASE_URL="postgresql://postgres:your-password@your-project-ref.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. Initialize Database
```bash
npx prisma migrate dev
```

### 4. Import Content
```bash
npm run validate-content  # Validate 88 lesson files
npm run import-content    # Import to database
```

### 5. Start Development
```bash
npm run dev
```

Visit:
- **App**: http://localhost:3000
- **Admin**: http://localhost:3000/admin

## 📊 What's Included

### 🎓 Content Management System
- **88 AI Lessons** automatically parsed from markdown
- **8 Learning Paths** with smart categorization
- **22+ AI Tools** covered (ChatGPT, Claude, Gemini, etc.)
- **Automatic Content Processing** with frontmatter extraction

### 🛠️ Technical Features
- **Next.js 15** with App Router
- **TypeScript** with strict mode
- **Prisma ORM** with Supabase PostgreSQL
- **NextAuth.js** for authentication
- **Tailwind CSS** for styling
- **Comprehensive API** for content management

### 📚 Learning Management
- User progress tracking
- Exercise and assessment system
- Certification management
- Team collaboration features
- Advanced analytics

## 🎯 Content Statistics

- **88 Total Lessons** from lesson-00 to lesson-87
- **8 Learning Paths** organized by category
- **3 Difficulty Levels** (Beginner: 22, Intermediate: 11, Advanced: 55)
- **Top AI Tools**: Claude (22), ChatGPT (21), Gemini (16), Perplexity (14)

## 🗂️ Learning Paths

1. **Text & Research AI Mastery** (28 lessons) - ChatGPT, Claude, Gemini, Perplexity
2. **Visual AI Creation** (18 lessons) - DALL-E, Midjourney, Stable Diffusion
3. **Core AI Fundamentals** (10 lessons) - AI basics and tool selection
4. **AI-Powered Productivity** (7 lessons) - Notion AI, Copilot, Workspace AI
5. **AI Automation & Integration** (6 lessons) - Zapier, N8N, Power Automate
6. **Video & Audio AI** (6 lessons) - RunwayML, ElevenLabs, Suno AI
7. **AI Business Strategy** (5 lessons) - Ethics, ROI, governance
8. **AI-Assisted Development** (4 lessons) - Cursor, Lovable, V0

## 🎨 Admin Dashboard

Access the admin interface at `/admin` to:
- Import and validate content
- Monitor system statistics
- Manage learning paths
- View content analytics
- Handle bulk operations

## 📝 Available Scripts

### Content Management
- `npm run setup` - Complete project setup
- `npm run validate-content` - Validate all lesson files
- `npm run import-content` - Import content to database
- `npm run import-content:clear` - Clear and re-import

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🏗️ System Architecture

```
master-ai-saas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # REST API routes
│   │   └── ...
│   ├── components/            # React components
│   ├── lib/                   # Core utilities
│   │   ├── content-parser.ts  # Markdown processing
│   │   ├── content-importer.ts # Database import
│   │   └── ...
├── scripts/                   # Management scripts
├── prisma/                    # Database schema
├── lesson-*.md               # 88 lesson files (root level)
└── ...
```

## 🔧 Core Components

### Content Parser
- Reads 88 markdown lesson files
- Extracts frontmatter metadata
- Converts to HTML
- Infers tools and difficulty
- Auto-categorizes content

### Content Importer
- Batch imports to database
- Creates learning paths
- Handles updates
- Provides statistics

### API Layer
- RESTful endpoints
- Authentication
- Error handling
- Input validation

### Admin Interface
- Real-time statistics
- Import controls
- Validation results
- Content management

## 🗄️ Database Schema

Key models:
- **User** - Authentication and profiles
- **Lesson** - Core lesson content
- **LearningPath** - Course organization
- **UserProgress** - Learning tracking
- **Exercise** - Assessments
- **Certification** - Achievement system

## 🚀 Production Deployment

1. **Environment Setup**
   - Configure production database
   - Set secure environment variables
   - Enable proper logging

2. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

3. **Content Import**
   ```bash
   npm run import-content
   ```

4. **Build & Deploy**
   ```bash
   npm run build
   npm run start
   ```

## 📚 Documentation

- **[Content Management Guide](CONTENT_MANAGEMENT_GUIDE.md)** - Complete system documentation
- **[API Documentation](src/app/api/)** - REST API endpoints
- **[Database Schema](prisma/schema.prisma)** - Data model definitions

## 🛟 Support

### Common Issues
1. **Database Connection**: Check DATABASE_URL in .env
2. **Import Failures**: Run `npm run validate-content` first
3. **Permission Errors**: Ensure file read permissions

### Debug Commands
```bash
npm run validate-content        # Check content files
npx prisma studio              # Database browser
npx prisma db pull             # Check connection
```

## 🎯 Next Steps

After setup:
1. Configure authentication providers
2. Customize learning paths
3. Add custom exercises
4. Set up monitoring
5. Deploy to production

---

**Built with Next.js, TypeScript, Prisma, and Supabase**  
*Ready for immediate user testing and production deployment*# Force redeploy with Supabase config Mon Aug 11 22:22:03 AEST 2025
