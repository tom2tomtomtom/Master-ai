# Master AI SaaS - Production Deployment Guide

This comprehensive guide covers the production deployment of the Master AI educational SaaS platform. Follow these steps to deploy a secure, scalable, and production-ready application.

## 🚀 Quick Deployment Checklist

- [ ] **Domain & SSL**: Custom domain configured with SSL
- [ ] **Database**: PostgreSQL database provisioned and migrated
- [ ] **Environment Variables**: All production variables configured
- [ ] **Third-Party Services**: Stripe, OAuth, Email service configured
- [ ] **Monitoring**: Error tracking and analytics set up
- [ ] **Security**: Headers, rate limiting, and validation in place
- [ ] **CI/CD**: GitHub Actions workflow tested and deployed
- [ ] **Health Checks**: Monitoring and alerting configured

## 📋 Prerequisites

### Required Accounts & Services
1. **Vercel Account** (Primary hosting platform)
2. **GitHub Repository** (Source code and CI/CD)
3. **PostgreSQL Database** (Vercel Postgres or Railway)
4. **Stripe Account** (Payment processing)
5. **Google Cloud Console** (OAuth - optional)
6. **GitHub OAuth App** (Authentication - optional)
7. **Sentry Account** (Error tracking - recommended)
8. **Email Service** (Resend/SendGrid - recommended)

### Development Environment
- Node.js 18+ installed
- Git configured
- Vercel CLI installed: `npm i -g vercel`

## 🏗️ Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)
1. Login to Vercel Dashboard
2. Go to Storage → Create Database → Postgres
3. Name: `master-ai-production`
4. Region: Choose closest to your users
5. Copy the connection strings (pooled and direct)

### Option B: Railway Postgres
1. Login to Railway
2. Create new project → Add PostgreSQL
3. Copy connection string from Variables tab

### Database Configuration
```bash
# Production database URLs
DATABASE_URL="postgres://default:password@host:5432/verceldb?sslmode=require"
DATABASE_URL_NON_POOLING="postgres://default:password@host:5432/verceldb?sslmode=require"
```

## 🔐 Step 2: Environment Variables Configuration

### Copy and configure environment variables:
```bash
cp .env.example .env.production
```

### Edit `.env.production` with your production values:

#### Core Application
```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secure-32-char-secret
```

#### Database
```env
DATABASE_URL=your-production-database-url
DATABASE_URL_NON_POOLING=your-direct-database-url
```

#### Authentication (Optional)
```env
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-secret
```

#### Stripe (Production Keys)
```env
STRIPE_PUBLISHABLE_KEY=pk_live_your-key
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-key
```

#### Monitoring & Analytics
```env
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_POSTHOG_KEY=phc_your-posthog-key
```

#### Email Service
```env
RESEND_API_KEY=re_your-resend-key
FROM_EMAIL=noreply@your-domain.com
```

## 🚢 Step 3: Vercel Deployment Setup

### 1. Connect GitHub Repository
1. Go to Vercel Dashboard
2. Import Project → From Git Repository
3. Select your Master AI repository
4. Configure project settings:
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2. Configure Environment Variables
In Vercel dashboard → Settings → Environment Variables:
- Add all variables from `.env.production`
- Set Environment: Production
- **Important**: Use Vercel's secret management for sensitive data

### 3. Configure Custom Domain
1. Domains tab → Add Domain
2. Enter your domain: `your-domain.com`
3. Configure DNS records as instructed
4. SSL certificate will be auto-generated

## ⚙️ Step 4: Third-Party Service Configuration

### Stripe Setup
1. Create Stripe products and prices:
```bash
npm run setup-stripe-products
```

2. Configure webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/api/stripe/webhooks`
   - Events: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`
   - Copy webhook secret to environment variables

### OAuth Providers Setup

#### Google OAuth
1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`

#### GitHub OAuth
1. GitHub → Settings → Developer settings → OAuth Apps
2. New OAuth App
3. Authorization callback URL: `https://your-domain.com/api/auth/callback/github`

### Email Service (Resend)
1. Create Resend account
2. Verify your domain
3. Generate API key
4. Configure DNS records for domain verification

## 🔄 Step 5: CI/CD Pipeline Setup

### GitHub Repository Setup
1. Add repository secrets (GitHub repo → Settings → Secrets):
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
DATABASE_URL=your-production-database-url
```

### Vercel Token Generation
```bash
vercel login
vercel --token # This will show your token
```

### Test the Pipeline
1. Create a pull request
2. Verify preview deployment works
3. Merge to main branch
4. Verify production deployment succeeds

## 🚀 Step 6: Initial Production Setup

### 1. Run Database Migrations
```bash
# After first deployment, run:
npm run production-setup

# Or dry run first:
npm run production-setup:dry-run
```

### 2. Verify Deployment
Check these endpoints:
- `https://your-domain.com` - Main application
- `https://your-domain.com/api/health` - Health check
- `https://your-domain.com/auth/signin` - Authentication
- `https://your-domain.com/dashboard` - User dashboard

### 3. Test Critical Flows
- [ ] User registration and email verification
- [ ] OAuth authentication (Google/GitHub)
- [ ] Subscription upgrade flow
- [ ] Lesson access and content loading
- [ ] Payment processing with Stripe
- [ ] Certificate generation

## 📊 Step 7: Monitoring & Analytics Setup

### Sentry Error Tracking
1. Create Sentry project
2. Install Sentry CLI: `npm install -g @sentry/cli`
3. Configure source maps upload in GitHub Actions
4. Set up alerts for critical errors

### Health Monitoring
Configure uptime monitoring:
- **Endpoint**: `https://your-domain.com/api/health`
- **Frequency**: Every 5 minutes
- **Alert Threshold**: 3 consecutive failures

### Performance Monitoring
Monitor these metrics:
- Page load times
- API response times
- Database query performance
- Error rates

## 🔒 Step 8: Security Verification

### Security Headers Check
Use [securityheaders.com](https://securityheaders.com) to verify:
- [ ] Content Security Policy
- [ ] HTTP Strict Transport Security
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options

### SSL/TLS Configuration
Verify SSL setup:
- [ ] SSL certificate valid and trusted
- [ ] HTTP redirects to HTTPS
- [ ] HSTS header present

### Rate Limiting Test
Test API endpoints for proper rate limiting:
```bash
# Test rate limiting
for i in {1..20}; do curl -I https://your-domain.com/api/dashboard/stats; done
```

## 🎯 Step 9: User Testing Preparation

### Create Test Accounts
1. Admin account (if ADMIN_EMAIL env var set)
2. Test user accounts for different subscription tiers
3. Stripe test customers for payment testing

### Content Verification
- [ ] All 88 lessons imported correctly
- [ ] Learning paths configured
- [ ] Achievements system working
- [ ] Certificates generating properly

### Performance Baseline
Establish performance baselines:
- Homepage load time: < 2s
- Dashboard load time: < 3s
- Lesson viewer load time: < 2s
- API response times: < 500ms

## 🚨 Step 10: Launch Readiness

### Pre-Launch Checklist
- [ ] All environment variables configured
- [ ] Database migrated and seeded
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Monitoring and alerting configured
- [ ] Error tracking working
- [ ] Payment processing tested
- [ ] Email notifications working
- [ ] CI/CD pipeline functioning
- [ ] Backup procedures documented

### Launch Day Checklist
- [ ] Final deployment completed
- [ ] Health checks passing
- [ ] DNS propagation complete
- [ ] Team notified of launch
- [ ] Monitoring dashboards ready
- [ ] Support processes prepared

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs
# Common fix: clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues
```bash
# Test database connection
npx prisma db pull
# Check connection string format and SSL requirements
```

#### Environment Variable Issues
- Ensure all required variables are set in Vercel dashboard
- Check for typos in variable names
- Verify secrets are properly configured

#### Stripe Webhook Issues
- Verify webhook URL is correct
- Check webhook secret matches environment variable
- Ensure webhook endpoint is accessible (not behind auth)

### Performance Issues
- Check Vercel function regions
- Monitor database query performance
- Verify CDN configuration
- Check image optimization settings

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- Weekly security updates
- Monthly dependency updates
- Quarterly performance reviews
- Database backup verification

### Monitoring Dashboards
Set up dashboards for:
- Application uptime and performance
- Error rates and types
- User engagement metrics
- Business metrics (signups, subscriptions)

### Backup Strategy
- Database: Automated daily backups
- Application: Git repository with tags
- Configuration: Environment variables documented
- Certificates: Stored in secure location

## 🎉 Success Metrics

Track these key metrics post-launch:
- **Uptime**: > 99.9%
- **Page Load Speed**: < 3s average
- **Error Rate**: < 0.1%
- **User Satisfaction**: Monitor support requests
- **Conversion Rate**: Track signup → subscription

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Stripe Integration Guide](https://stripe.com/docs)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)

---

**Note**: This guide provides a comprehensive deployment strategy. Adjust configurations based on your specific requirements, traffic expectations, and compliance needs.

For questions or issues during deployment, refer to the troubleshooting section or create a GitHub issue in the repository.