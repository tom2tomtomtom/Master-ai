# Master-AI SaaS Staging Deployment Guide

## Overview
This guide walks you through deploying the Master-AI SaaS platform to a staging environment for user testing.

## Prerequisites
- Vercel account (recommended) or Railway account
- GitHub repository with the Master-AI SaaS codebase
- Stripe test account for payment processing
- Email service account (optional, for password resets)

## Deployment Steps

### 1. Database Setup

**Option A: Vercel Postgres (Recommended)**
1. Login to Vercel Dashboard
2. Create new project from your GitHub repository
3. Go to Storage tab → Create Database → Postgres
4. Copy the DATABASE_URL from the .env.local tab
5. Note down the connection details for later use

**Option B: Railway PostgreSQL**
1. Login to Railway (railway.app)
2. Create new project → Deploy PostgreSQL
3. Copy the DATABASE_URL from Variables tab
4. Note down the connection details

### 2. Environment Variables Configuration

Set the following environment variables in your deployment platform:

```bash
# Application Configuration
NODE_ENV=production
APP_ENV=staging
NEXTAUTH_URL=https://your-staging-domain.vercel.app

# Database
DATABASE_URL=your_postgresql_connection_string

# Authentication
NEXTAUTH_SECRET=your_secure_random_string_here

# Stripe (Test Mode)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Admin Configuration (optional)
ADMIN_EMAIL=admin@yourcompany.com

# Public Configuration
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://your-staging-domain.vercel.app
```

### 3. Deploy Application

**For Vercel:**
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy the application
4. Note the deployment URL

**For Railway:**
1. Connect your GitHub repository to Railway
2. Configure environment variables in Railway dashboard
3. Deploy the application
4. Note the deployment URL

### 4. Database Setup and Content Import

After successful deployment, run the production setup:

1. Open your deployment platform's console/terminal
2. Run the production setup command:
   ```bash
   npm run production-setup
   ```

This will:
- Run database migrations
- Seed achievements
- Set up Stripe products
- Import all 89 lessons
- Create admin user (if ADMIN_EMAIL is set)

### 5. Stripe Configuration

1. Login to your Stripe test account
2. Create products for your subscription tiers:
   - Pro Monthly
   - Pro Annual  
   - Team Monthly
   - Team Annual
3. Copy the price IDs and update your environment variables
4. Set up webhook endpoint: `https://your-domain/api/stripe/webhooks`

### 6. Validation Checklist

After deployment, validate the following:

#### Basic Functionality
- [ ] Application loads at staging URL
- [ ] Homepage displays correctly
- [ ] User registration works
- [ ] User login works
- [ ] Password reset functionality
- [ ] Dashboard loads for authenticated users

#### Content Access
- [ ] All 89 lessons are accessible
- [ ] Learning paths display correctly (8 paths)
- [ ] Free lessons accessible to all users
- [ ] Premium lessons gated for free users
- [ ] Lesson content renders properly (markdown)
- [ ] Lesson navigation works

#### Subscription System
- [ ] Pricing page displays correctly
- [ ] Stripe checkout process works
- [ ] Subscription status updates correctly
- [ ] Premium content unlocked for paid users
- [ ] Billing dashboard accessible

#### User Experience
- [ ] Dashboard shows accurate progress
- [ ] Bookmarking functionality works
- [ ] Note-taking feature functions
- [ ] Achievement system works
- [ ] Search functionality operational

### 7. User Testing Access

Provide test users with:

1. **Staging URL**: `https://your-staging-domain.vercel.app`

2. **Test Accounts**:
   - Create test user accounts for different subscription tiers
   - Provide Stripe test card numbers:
     - Success: `4242 4242 4242 4242`
     - Decline: `4000 0000 0000 0002`

3. **Test Scenarios**:
   - Complete user registration flow
   - Browse and access free lessons
   - Attempt premium lesson access (should be blocked)
   - Subscribe to Pro plan with test card
   - Access premium lessons after subscription
   - Test progress tracking and achievements

### 8. Monitoring Setup

Configure basic monitoring:

1. **Health Checks**: `https://your-domain/api/health`
2. **Error Tracking**: Set up Sentry (optional)
3. **Performance Monitoring**: Use Vercel Analytics or similar

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify DATABASE_URL is correctly configured
- Check database server is running and accessible
- Ensure database user has necessary permissions

**Build Failures**
- Check Node.js version (18.x required)
- Verify all environment variables are set
- Check for TypeScript errors

**Authentication Issues**
- Verify NEXTAUTH_URL matches deployment URL
- Ensure NEXTAUTH_SECRET is set and secure
- Check OAuth provider configurations

**Stripe Integration Issues**
- Verify test mode keys are being used
- Check webhook endpoint configuration
- Ensure products and prices are created

### Support
If you encounter issues during deployment, check:
1. Application logs in your deployment platform
2. Database connection and migration status
3. Environment variable configuration
4. Network and firewall settings

## Success Metrics

A successful staging deployment should have:
- ✅ 100% uptime health check
- ✅ All 89 lessons accessible
- ✅ Complete user registration/login flow
- ✅ Working subscription and payment processing
- ✅ Proper content gating for free vs premium users
- ✅ Full lesson navigation and progress tracking

## Next Steps

After successful staging deployment and validation:
1. Conduct user testing sessions
2. Gather feedback on UX/UI
3. Monitor performance and error rates
4. Iterate based on user feedback
5. Prepare for production deployment

---

Generated on: ${new Date().toISOString()}
Project: Master-AI SaaS Platform
Status: Ready for Staging Deployment