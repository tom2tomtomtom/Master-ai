# Master-AI Stripe Integration Guide

This guide covers the complete Stripe payment integration for the Master-AI platform, including subscription management, billing, and content access control.

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Environment Configuration](#environment-configuration)
4. [Stripe Dashboard Configuration](#stripe-dashboard-configuration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [API Reference](#api-reference)
8. [Components Reference](#components-reference)
9. [Troubleshooting](#troubleshooting)

## Overview

The Stripe integration provides:

- **4 Subscription Tiers**: Free, Pro ($49/month), Team ($99/user/month), Enterprise (custom)
- **Billing Management**: Automated subscription lifecycle, prorations, cancellations
- **Content Access Control**: Tier-based feature gating and lesson access
- **Payment UI**: Pricing pages, checkout flows, billing dashboard
- **Webhook Processing**: Real-time subscription status updates
- **Security**: PCI compliance through Stripe Elements

### Subscription Tiers

| Feature | Free | Pro ($49/mo) | Team ($99/user/mo) | Enterprise |
|---------|------|--------------|--------------------|-----------| 
| Lessons | 4 basic lessons | All 81 lessons | All 81 lessons | All 81 lessons |
| Exercises | ❌ | ✅ | ✅ | ✅ |
| Certificates | ❌ | ✅ | ✅ | ✅ |
| Team Management | ❌ | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| Free Trial | ❌ | 7 days | ❌ | Custom |

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed in the project:
- `stripe` - Server-side Stripe SDK
- `@stripe/stripe-js` - Client-side Stripe SDK
- `micro` - For webhook processing

### 2. Environment Configuration

Copy the environment template:

```bash
cp .env.example .env.local
```

Add your Stripe keys to `.env.local`:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key"
STRIPE_SECRET_KEY="sk_test_your_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key"
```

### 3. Database Migration

Update your database schema to include Stripe models:

```bash
npx prisma db push
```

### 4. Create Stripe Products

Run the automated setup script:

```bash
npm run setup-stripe-products
```

This script will:
- Create Stripe products for Pro and Team tiers
- Create monthly and annual price points
- Update your `.env.local` with price IDs

### 5. Configure Webhooks

In your Stripe Dashboard:

1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set URL to: `https://yourdomain.com/api/stripe/webhooks`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Stripe Dashboard Configuration

### 1. Billing Portal Configuration

Configure the customer portal in Stripe Dashboard:

1. Go to **Settings > Billing portal**
2. Enable these features:
   - Update payment methods
   - Download invoices
   - View subscription history
   - Cancel subscriptions
   - Update billing information

### 2. Tax Configuration (Optional)

1. Go to **Products > Tax**
2. Configure tax settings for your regions
3. Enable automatic tax calculation if needed

## Testing

### Test Cards

Use Stripe's test cards for development:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **3D Secure**: `4000 0025 0000 3155`

### Test Scenarios

1. **Free to Pro Upgrade**:
   - Sign up with free account
   - Navigate to billing page
   - Upgrade to Pro with trial

2. **Subscription Management**:
   - Cancel subscription (end of period)
   - Reactivate cancelled subscription
   - Update payment method via portal

3. **Content Access Control**:
   - Try accessing paid lessons with free account
   - Verify upgrade prompts appear
   - Test lesson access after upgrade

4. **Webhook Processing**:
   - Monitor webhook logs in Stripe Dashboard
   - Verify database updates after payments
   - Test failed payment scenarios

## Deployment

### Environment Variables

Set these in your production environment:

```env
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
# Price IDs will be different for live mode
```

### Security Checklist

- ✅ Use HTTPS for all Stripe interactions
- ✅ Validate webhook signatures
- ✅ Never log sensitive payment data
- ✅ Use environment variables for secrets
- ✅ Implement proper error handling
- ✅ Set up monitoring and alerts

## API Reference

### Subscription Management

#### `GET /api/subscriptions/current`
Get current user's subscription details.

#### `POST /api/stripe/create-checkout-session`
Create Stripe checkout session for new subscriptions.

```json
{
  "tier": "pro",
  "interval": "month",
  "quantity": 1,
  "successUrl": "https://app.com/success",
  "cancelUrl": "https://app.com/cancel"
}
```

#### `POST /api/stripe/create-portal-session`
Create billing portal session for subscription management.

#### `POST /api/subscriptions/upgrade`
Upgrade existing subscription to higher tier.

#### `POST /api/subscriptions/cancel`
Cancel subscription (end of period or immediately).

### Webhooks

#### `POST /api/stripe/webhooks`
Handles all Stripe webhook events with signature verification.

## Components Reference

### Pricing Components

- `<PricingSection />` - Complete pricing page with upgrade functionality
- `<PricingCard />` - Individual tier pricing card
- `<SubscriptionWidget />` - Dashboard subscription overview

### Access Control

- `<SubscriptionGate />` - Blocks content for insufficient subscription
- `<UpgradePrompt />` - Encourages users to upgrade
- `<SubscriptionIndicator />` - Shows current subscription status

### Billing Management

- `<BillingDashboard />` - Complete billing management interface
- Invoice history and downloads
- Payment method management

## Content Access Control

### Server-Side Protection

```typescript
import { checkLessonAccess } from '@/lib/subscription-access'

const accessResult = await checkLessonAccess(userId, lessonNumber)
if (!accessResult.hasAccess) {
  // Show upgrade prompt or redirect
}
```

### Client-Side Gates

```tsx
import { SubscriptionGate } from '@/components/subscription/subscription-gate'

<SubscriptionGate
  feature="allLessons"
  currentTier="free"
  requiredTier="pro"
  title="Pro Feature Required"
>
  <ProtectedContent />
</SubscriptionGate>
```

## Troubleshooting

### Common Issues

#### Webhook Not Receiving Events
- Check webhook URL is correct and accessible
- Verify webhook secret matches Stripe Dashboard
- Check webhook endpoint logs for errors
- Ensure webhook events are selected in Dashboard

#### Checkout Session Fails
- Verify price IDs are correct
- Check customer metadata is set properly
- Ensure success/cancel URLs are valid
- Review Stripe logs for detailed error messages

#### Subscription Status Not Updating
- Check webhook processing logs
- Verify database updates in webhook handlers
- Ensure user ID mapping is correct
- Check for duplicate webhook processing

#### Access Control Not Working
- Verify subscription status in database
- Check feature access configuration
- Test with different subscription tiers
- Review server-side access control logic

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=stripe:*
```

### Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Community](https://github.com/stripe/stripe-node)
- [Master-AI Integration Issues](your-repo/issues)

## Security Considerations

### PCI Compliance

- Never store raw card data
- Use Stripe Elements for card input
- Validate all webhook signatures
- Implement proper error handling
- Use HTTPS everywhere

### Data Protection

- Encrypt sensitive data at rest
- Limit access to payment data
- Implement audit logging
- Regular security reviews
- Follow GDPR/privacy regulations

### Monitoring

Set up alerts for:
- Failed payments
- Webhook failures
- Subscription cancellations
- Unusual payment patterns
- Security events

---

For additional support or questions about the Stripe integration, please refer to the Stripe documentation or contact the development team.