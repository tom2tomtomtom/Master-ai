# Lesson System Setup Guide

## Current Status

**Problem**: Database connection failing in production
**Result**: No lessons displaying on /discover or /dashboard

## Root Cause

The Playwright tests reveal:
```
❌ Authentication failed against database server
❌ Database credentials for `postgres` are not valid
```

## Solution Steps

### Step 1: Fix Database Connection

You need to update your Vercel environment variables with valid Supabase credentials:

1. **Get your Supabase credentials:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Settings → Database
   - Copy the "Connection string" (Transaction mode for DATABASE_URL)
   - Copy the "Connection string" (Session mode for DIRECT_DATABASE_URL)

2. **Update Vercel environment variables:**
   ```bash
   npx vercel env rm DATABASE_URL production
   npx vercel env add DATABASE_URL production
   # Paste your Supabase connection string

   npx vercel env rm DIRECT_DATABASE_URL production
   npx vercel env add DIRECT_DATABASE_URL production
   # Paste your Supabase direct connection string
   ```

3. **Verify the format:**
   ```
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Step 2: Import Lessons to Database

Once the database connection works, you need to import the 86 lesson files into the database:

**Option A: Using the import script (Recommended)**

```bash
# Make sure your local .env has correct Supabase credentials
npm run import-content
```

This script reads all `lesson-*.md` files and imports them to the database.

**Option B: Manual import via API**

```bash
npx tsx scripts/trigger-production-import.ts
```

### Step 3: Verify Setup

```bash
# Test database connection
npx playwright test e2e/lesson-functionality.spec.ts --project=chromium

# Expected result:
# ✅ Database health: connected
# ✅ API returns lessons: 86 lessons
# ✅ Discover page shows lesson cards
```

### Step 4: Redeploy

```bash
npx vercel deploy --prod
```

## How the Lesson System Works

### Database Schema

Lessons are stored in the `lessons` table with:
- `id` (cuid)
- `lessonNumber` (1-88)
- `title`
- `description`
- `content` (markdown)
- `tools` (array of AI tools covered)
- `isPublished` (boolean)
- `isFree` (boolean)

### API Endpoints

1. **GET /api/lessons** - List all lessons
   - Supports pagination, filtering, searching
   - Returns published lessons only (unless admin)

2. **GET /api/lessons/[id]** - Get single lesson
   - Returns full lesson content
   - Tracks user progress

3. **GET /api/lessons/search** - Search lessons
   - Full-text search across title/description/content

### Frontend Pages

1. **/discover** - Public lesson discovery page
   - Shows all published lessons
   - Filtering by tool, difficulty, category
   - Search functionality

2. **/dashboard/lessons** - User's lessons dashboard
   - Shows enrolled/bookmarked lessons
   - Progress tracking
   - Personalized recommendations

3. **/dashboard/lesson/[id]** - Individual lesson viewer
   - Markdown rendering
   - Note-taking
   - Progress tracking
   - Video player (if videoUrl exists)

## Expected User Flow

1. **Visitor** → Visits /discover
2. **Browse** → Sees 86 lesson cards with titles, tools, difficulty
3. **Filter** → Can filter by ChatGPT, Claude, Midjourney, etc.
4. **Preview** → Can preview lesson descriptions
5. **Sign Up** → Required to access full lessons (unless marked isFree)
6. **Learn** → Watch video, read content, take notes
7. **Progress** → System tracks completion, bookmarks
8. **Certificates** → Earn certificates upon path completion

## Quick Test Commands

```bash
# Test database connection
curl https://master-ai-saas-[your-deployment].vercel.app/api/health/database

# Test lessons API
curl https://master-ai-saas-[your-deployment].vercel.app/api/lessons

# Test search
curl "https://master-ai-saas-[your-deployment].vercel.app/api/lessons/search?q=chatgpt"
```

## Troubleshooting

### Database won't connect
- Verify Supabase project is active
- Check password hasn't expired
- Ensure IP restrictions allow Vercel IPs
- Verify connection pooling is enabled

### Lessons not importing
- Check markdown files exist in root directory
- Verify file naming: `lesson-[number]-[slug].md`
- Check file permissions
- Review import logs for specific errors

### Lessons display but don't open
- Check `isPublished` is true in database
- Verify user has appropriate subscription tier
- Check authentication is working

### Performance issues
- Enable Prisma query caching
- Add database indexes (already in schema)
- Consider Redis caching for frequently accessed lessons

## Need Help?

Run the comprehensive test suite:
```bash
npx playwright test e2e/lesson-functionality.spec.ts --headed
```

This will show exactly where the system is failing.
