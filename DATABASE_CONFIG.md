# Database Configuration Guide

## ⚠️ CRITICAL: SUPABASE ONLY CONFIGURATION ⚠️

This project uses **Supabase as the single database** for ALL environments (development, staging, production).

## ❌ What NOT to Do

**NEVER configure local PostgreSQL:**
```bash
# ❌ WRONG - Do not use local postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/master_ai_saas"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/master_ai_saas"
```

## ✅ Correct Configuration

**ALWAYS use Supabase connections:**
```bash
# ✅ CORRECT - Supabase connections
DATABASE_URL="postgresql://postgres.fsohtauqtcftdjcjfdpq:MaySPWgaFDl4StLd.@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1&pool_mode=transaction"
DIRECT_DATABASE_URL="postgresql://postgres.fsohtauqtcftdjcjfdpq:MaySPWgaFDl4StLd.@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Supabase API Configuration
NEXT_PUBLIC_SUPABASE_URL="https://fsohtauqtcftdjcjfdpq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🔄 Migration Process (If Local DB Was Used)

If you accidentally configured local PostgreSQL, follow these steps:

### 1. Update Environment Files
```bash
# Update .env (development)
# Update .env.production (production)
# Update .env.local (if exists)
```

### 2. Sync Schema to Supabase
```bash
npx prisma db push
```

### 3. Import Lesson Content
```bash
CONTENT_IMPORT_KEY=master-ai-import-2025 npx tsx scripts/trigger-production-import.ts
```

### 4. Verify Connection
```bash
npx prisma studio  # Should open to Supabase data
```

## 🚨 Why This Matters

**Problems with local PostgreSQL:**
- Different data between development and production
- Missing lessons in production UI
- API endpoints return empty results
- Database connection errors in deployment
- Cannot share data between team members

**Benefits of Supabase-only:**
- Single source of truth for all data
- Lessons available immediately in all environments  
- Real-time collaboration capabilities
- Consistent behavior across environments
- No local database maintenance required

## 🔧 Troubleshooting

**If lessons are missing from UI:**
1. Check DATABASE_URL points to Supabase
2. Run lesson import script
3. Verify API endpoints return data
4. Check Supabase dashboard for data

**If API returns 500 errors:**
1. Verify Supabase connection strings are correct
2. Check environment variables are set in Vercel
3. Ensure schema is synced with `npx prisma db push`

## 📋 Environment Variables Checklist

**Required in ALL environments (.env, .env.production, Vercel):**
- [ ] `DATABASE_URL` - Supabase pooler connection
- [ ] `DIRECT_DATABASE_URL` - Direct Supabase connection  
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- [ ] `CONTENT_IMPORT_KEY` - For lesson imports

## 🎯 Quick Validation

**Test database connection works:**
```bash
# Should show Supabase data, not local data
npx prisma studio
```

**Test lessons API:**
```bash
# Should return lesson data from Supabase
curl https://www.master-ai-learn.com/api/lessons
```

**Remember: One database, all environments, always Supabase! 🚀**