# Force Vercel Redeployment After Environment Variable Changes

## Issue
After updating Vercel environment variables to point to Supabase, the API still returns 500 errors because the deployment hasn't picked up the new environment variables.

## Solution: Trigger New Deployment

### Option 1: Via Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `master-ai-saas` project
3. Go to "Deployments" tab
4. Click "Redeploy" on the latest deployment
5. Select "Use existing Build Cache" = **NO** (force fresh build)
6. Click "Redeploy"

### Option 2: Push a Commit to Trigger CI/CD
```bash
# Make a small change to trigger redeployment
echo "# Force redeploy $(date)" >> README.md
git add README.md
git commit -m "Force redeploy with updated Supabase environment variables"
git push origin main
```

### Option 3: Via Vercel CLI
```bash
# If you have Vercel CLI installed
vercel --prod
```

## Expected Timeline
- **Deployment**: 2-3 minutes
- **DNS Propagation**: 1-2 minutes
- **Total**: ~5 minutes until API works

## Test After Redeployment
```bash
# Should return JSON with lesson data instead of 500 error
curl https://www.master-ai-learn.com/api/lessons

# Should show database connection info
curl https://www.master-ai-learn.com/api/health
```

## Expected Results After Successful Redeployment
- ✅ `https://www.master-ai-learn.com/api/lessons` returns lesson JSON
- ✅ Dashboard shows all 86 lessons
- ✅ Users can access lesson content  
- ✅ No more 500 errors on API endpoints
- ✅ Lessons are visible and functional in UI

## Current Status
- ✅ Lessons imported to Supabase (86 lessons)
- ✅ Vercel environment variables updated
- ⏳ **Waiting for redeployment to pick up new config**
- ⏳ Then lessons should be fully accessible

---

*After redeployment, the Master AI platform will be fully functional with all 86 lessons accessible to users!*