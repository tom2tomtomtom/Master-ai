# Master-AI SaaS Staging Deployment Checklist

## Pre-Deployment Setup

### 1. Repository Preparation
- [ ] Code is committed to main branch
- [ ] `.env.staging` file created with staging configuration
- [ ] Build passes locally: `npm run build`
- [ ] TypeScript compilation succeeds: `npm run type-check`

### 2. Database Setup
- [ ] PostgreSQL database created (Vercel Postgres or Railway)
- [ ] Database connection URL obtained
- [ ] Database is accessible from deployment platform

### 3. Stripe Configuration (Test Mode)
- [ ] Stripe test account created
- [ ] Test API keys obtained:
  - [ ] `STRIPE_PUBLISHABLE_KEY` (pk_test_...)
  - [ ] `STRIPE_SECRET_KEY` (sk_test_...)
- [ ] Products created for subscription tiers:
  - [ ] Pro Monthly
  - [ ] Pro Annual
  - [ ] Team Monthly
  - [ ] Team Annual
- [ ] Price IDs obtained for each product

## Deployment Process

### 4. Platform Setup (Vercel Recommended)
- [ ] Vercel account connected to GitHub repository
- [ ] Project created and linked to repository
- [ ] Build and deployment settings configured

### 5. Environment Variables Configuration
Required environment variables set in deployment platform:

**Core Configuration:**
- [ ] `NODE_ENV=production`
- [ ] `APP_ENV=staging`
- [ ] `NEXTAUTH_URL=https://your-staging-domain.vercel.app`
- [ ] `NEXTAUTH_SECRET=your-secure-random-string`

**Database:**
- [ ] `DATABASE_URL=postgresql://...`

**Stripe (Test Mode):**
- [ ] `STRIPE_PUBLISHABLE_KEY=pk_test_...`
- [ ] `STRIPE_SECRET_KEY=sk_test_...`
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (configure after deployment)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`

**Stripe Price IDs:**
- [ ] `STRIPE_PRO_MONTHLY_PRICE_ID=price_...`
- [ ] `STRIPE_PRO_ANNUAL_PRICE_ID=price_...`
- [ ] `STRIPE_TEAM_MONTHLY_PRICE_ID=price_...`
- [ ] `STRIPE_TEAM_ANNUAL_PRICE_ID=price_...`

**Optional:**
- [ ] `ADMIN_EMAIL=admin@yourcompany.com`
- [ ] `RESEND_API_KEY=...` (for email functionality)
- [ ] `SENTRY_DSN=...` (for error tracking)

### 6. Initial Deployment
- [ ] Deploy application to staging platform
- [ ] Deployment succeeds without errors
- [ ] Staging URL is accessible: `https://your-domain.vercel.app`

## Post-Deployment Setup

### 7. Database Initialization
Run the production setup script in the deployment platform console:
- [ ] `npm run production-setup`
- [ ] Database migrations completed
- [ ] Achievement system seeded
- [ ] All 89 lessons imported successfully
- [ ] 8 learning paths created
- [ ] Admin user created (if configured)

### 8. Stripe Webhook Configuration
- [ ] Webhook endpoint created in Stripe dashboard
- [ ] Webhook URL: `https://your-domain/api/stripe/webhooks`
- [ ] Webhook secret obtained and added to environment variables
- [ ] Webhook events configured for subscription management

## Validation & Testing

### 9. Automated Validation
- [ ] Run staging validation script: `npm run validate-staging https://your-domain.vercel.app`
- [ ] All critical endpoints respond successfully
- [ ] Health checks pass
- [ ] Content pages accessible

### 10. Manual Testing Checklist

**Authentication Flow:**
- [ ] User registration works
- [ ] Email verification (if enabled)
- [ ] User login works
- [ ] Password reset functionality
- [ ] Logout functionality

**Content Access:**
- [ ] Homepage loads correctly
- [ ] Dashboard displays after login
- [ ] All 89 lessons are accessible
- [ ] Learning paths display correctly (8 paths)
- [ ] Free lessons accessible to all users
- [ ] Premium lessons gated for free users
- [ ] Lesson content renders properly (Markdown)
- [ ] Lesson navigation works (next/previous)

**Subscription System:**
- [ ] Pricing page displays correctly
- [ ] Stripe checkout opens successfully
- [ ] Test payment with `4242 4242 4242 4242` succeeds
- [ ] Subscription status updates correctly
- [ ] Premium content unlocked for paid users
- [ ] Billing dashboard accessible
- [ ] Subscription cancellation works

**User Experience:**
- [ ] Dashboard shows accurate progress
- [ ] Bookmarking functionality works
- [ ] Note-taking feature functions
- [ ] Achievement system works
- [ ] Search functionality operational
- [ ] Progress tracking accurate
- [ ] Certificate generation works

### 11. Performance & Monitoring
- [ ] Page load times acceptable (<3 seconds)
- [ ] API response times reasonable (<1 second)
- [ ] Error tracking configured (if using Sentry)
- [ ] Logs accessible and readable
- [ ] Health monitoring endpoint: `/api/health`

## User Testing Preparation

### 12. Test Accounts Setup
Create test user accounts for different scenarios:
- [ ] Free user account
- [ ] Pro subscriber account
- [ ] Team subscriber account
- [ ] Admin user account (if applicable)

### 13. Test Data Validation
- [ ] Sample user progress data
- [ ] Achievement notifications working
- [ ] Subscription status changes
- [ ] Payment processing logs

### 14. Documentation for Testers
- [ ] Staging URL provided to testers
- [ ] Test account credentials shared
- [ ] Stripe test card numbers provided:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
- [ ] Testing scenarios documented
- [ ] Feedback collection method established

## Security & Production Readiness

### 15. Security Validation
- [ ] HTTPS enabled and working
- [ ] Security headers configured
- [ ] No sensitive data exposed in client-side code
- [ ] API endpoints properly protected
- [ ] CORS configuration appropriate

### 16. Final Readiness Check
- [ ] All checklist items completed
- [ ] No critical errors in logs
- [ ] Performance acceptable under normal load
- [ ] Backup and recovery procedures documented
- [ ] Rollback plan prepared if needed

## Success Criteria

The staging environment is ready for user testing when:
- ✅ All 89 lessons are accessible and properly formatted
- ✅ Complete user authentication flow works
- ✅ Subscription system processes payments correctly
- ✅ Content gating works (free vs premium)
- ✅ User progress tracking functions
- ✅ No critical errors in application logs
- ✅ Performance meets acceptable standards

## Post-Testing Actions

After user testing is complete:
- [ ] Collect and analyze user feedback
- [ ] Document any issues or improvements needed
- [ ] Plan production deployment timeline
- [ ] Update production configuration based on staging learnings

---

**Deployment Team:** Solo Founder
**Review Date:** _____
**Approved for User Testing:** _____ (Date)
**Approved By:** _____ (Name)