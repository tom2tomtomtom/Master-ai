# Claude Suite Configuration

> Enhanced productivity suite active for Master-AI development
> Solo founder optimized workflows for rapid MVP development

## Project Context

**Master-AI**: Comprehensive AI education SaaS platform with 81+ lessons covering all major AI tools (ChatGPT, Claude, Gemini, etc.). Currently in MVP development phase for user testing before SaaS launch.

**Tech Stack**: Next.js 15 + TypeScript + Prisma + **Supabase** + NextAuth.js + Tailwind CSS
**Development Phase**: MVP → User Testing → SaaS Launch
**Timeline**: ASAP for user testing feedback

## ⚠️ CRITICAL DATABASE CONFIGURATION ⚠️

**IMPORTANT**: This project uses **SUPABASE ONLY** for all database operations:
- ❌ **NO LOCAL POSTGRESQL** - Never configure local postgres connections
- ✅ **SUPABASE ONLY** - All environments (dev, staging, prod) use Supabase
- ✅ **Single Source of Truth** - One database for all environments
- ✅ **Connection Details**: Use the Supabase connection strings in .env files

**Database URLs must ALWAYS point to Supabase:**
- `DATABASE_URL` = Supabase pooler connection (for app)
- `DIRECT_DATABASE_URL` = Direct Supabase connection (for migrations)
- `NEXT_PUBLIC_SUPABASE_URL` = Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key

## Available Commands

### Development Workflows
- `/daily-dev` - Complete daily development workflow
- `/mvp-development` - Rapid feature development for MVP
- `/analyze-codebase` - Deep codebase analysis and insights
- `/clean-codebase` - Automated code quality improvements
- `/pre-deploy-check` - Production deployment validation

### Planning & Specifications
- `/plan-product` - Strategic product planning and roadmaps
- `/create-spec` - Detailed feature specifications
- `/plan-feature` - Individual feature planning and breakdown

### Execution & Implementation
- `/execute-tasks` - Task execution with progress tracking
- `/build-feature` - Complete feature implementation
- `/integrate-content` - Lesson content integration system

### Quality & Deployment
- `/test-feature` - Comprehensive feature testing
- `/optimize-performance` - Performance analysis and optimization
- `/deploy-staging` - Staging deployment process
- `/deploy-production` - Production deployment with validation

## Development Priorities

1. **Content Management System** - Import 81 lessons into database
2. **User Dashboard** - Learning progress and navigation
3. **Lesson Viewer** - Interactive lesson experience
4. **Authentication Flow** - Complete signup/signin pages
5. **Progress Tracking** - Real user progress through lessons

## Standards & Patterns

**Code Style**: Follow existing TypeScript/Next.js patterns in codebase
**UI Components**: Use Radix UI + Tailwind CSS design system
**Database**: **SUPABASE ONLY** - Leverage existing Prisma schema with Supabase connections
**Authentication**: NextAuth.js + Supabase Auth with multiple provider support
**Deployment**: Vercel (primary) or Railway (alternative)

## 🔧 Database Setup Requirements

**Before ANY database work:**
1. ✅ Verify .env files use Supabase connection strings
2. ✅ Run `npx prisma db push` to sync schema with Supabase
3. ✅ Import lesson content using `scripts/trigger-production-import.ts`
4. ✅ Test API endpoints return data from Supabase

**Never use local PostgreSQL - this causes deployment issues and data inconsistencies.**

## Solo Founder Optimizations

- Prioritize user-facing features over admin functionality
- Use existing UI components and patterns when possible
- Focus on critical path features for MVP completion
- Implement rapid feedback loops with user testing
- Document decisions for future development reference

## Project References

- Product documentation in `.claude-suite/project/`
- Workflows and checklists in `.claude-suite/workflows/`
- Main application code in `master-ai-saas/src/`
- Lesson content files in root directory (lesson-*.md)

---

*Claude Suite Enhanced: Providing transparent development assistance with structured workflows, progress tracking, and solo founder optimization.*
- always have supabase as the db not postgreSQL
---

## 🚀 Ultimate Dev System Integration

This project is configured with the Ultimate Dev System for enhanced AI-assisted development.

### Tool Routing (nodejs project)
- **Cursor**: UI development, quick changes (0-15K lines)
- **Augment**: Large refactoring, cross-file changes (15K+ lines)  
- **Claude Code**: Testing, automation, deployment

### Available Specialists
Use natural language to activate specialists:
- "Build the UI" → frontend-developer + ui-engineer
- "Fix database issues" → database-optimizer + debugger
- "Add security" → security-auditor + auth-engineer
- "Optimize performance" → performance-engineer + perf-optimizer

### Quick Commands
- `~/ultimate-dev-system/smart-workflow.sh` - Context-aware recommendations
- `~/ultimate-dev-system/quick-switch.sh Master-AI` - Switch to this project
- Tell Claude: "Continue working on Master-AI" for smart continuation

### Configuration Files
- `.cursor/rules/` - Cursor-specific rules and specialist routing
- `.claude/commands/` - Custom Claude commands for this project
- `.augment/config.json` - Augment configuration and preferences
