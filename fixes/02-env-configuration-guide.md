# Environment Configuration Guide for Master-AI

## Overview
This guide consolidates all environment variables into a single, manageable configuration.

## Environment Files Structure

### 1. `.env.example` (Template - commit to git)
```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/master_ai
DIRECT_DATABASE_URL=postgresql://user:password@localhost:5432/master_ai

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email (Resend)
RESEND_API_KEY=

# Monitoring
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Content Management
CONTENT_ROOT_DIR=../

# Feature Flags
ENABLE_REDIS_CACHE=false
ENABLE_RATE_LIMITING=true
ENABLE_MONITORING=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. `.env.local` (Local development - don't commit)
Copy `.env.example` and fill in actual values

### 3. `.env.production` (Production - secure storage)
Production values stored in deployment platform

## Implementation Script

Create `master-ai-saas/scripts/setup-env.ts`:
