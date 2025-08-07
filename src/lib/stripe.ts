import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set. Stripe functionality will be unavailable.')
}

export const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
}) : null

// Stripe configuration constants
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  currency: 'usd',
  locale: 'en-US',
} as const

// Subscription tier configurations
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free Explorer',
    stripePriceId: null,
    features: [
      'Lesson 00 Tool Guide',
      '3 foundation lessons',
      'Community access',
      'Basic progress tracking'
    ],
    price: 0,
    interval: null,
  },
  pro: {
    name: 'Pro',
    stripePriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    stripePriceIdAnnual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
    features: [
      'All 81 lessons',
      'Interactive exercises',
      'Professional certificates',
      'Advanced analytics',
      'Email support',
      '7-day free trial'
    ],
    price: 49,
    priceAnnual: 490,
    interval: 'month',
    trialDays: 7,
  },
  team: {
    name: 'Team',
    stripePriceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
    stripePriceIdAnnual: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID!,
    features: [
      'Everything in Pro',
      'Team dashboard',
      'Progress analytics',
      'Custom learning paths',
      'Priority support',
      'Team member management'
    ],
    price: 99,
    priceAnnual: 990,
    interval: 'month',
    minSeats: 1,
    maxSeats: 100,
  },
  enterprise: {
    name: 'Enterprise',
    stripePriceId: null,
    features: [
      'Custom training',
      'Dedicated success manager',
      'API integrations',
      'Advanced security',
      'On-site training',
      'Custom pricing'
    ],
    price: null,
    interval: null,
    contactRequired: true,
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS
export type BillingInterval = 'month' | 'year'

// Helper functions
export function getSubscriptionTier(tier: string): SubscriptionTier {
  if (tier in SUBSCRIPTION_TIERS) {
    return tier as SubscriptionTier
  }
  return 'free'
}

export function getPriceId(tier: SubscriptionTier, interval: BillingInterval = 'month'): string | null {
  const tierConfig = SUBSCRIPTION_TIERS[tier]
  
  if (interval === 'year' && 'stripePriceIdAnnual' in tierConfig) {
    return tierConfig.stripePriceIdAnnual || null
  }
  
  return tierConfig.stripePriceId || null
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function calculateTrialEndDate(trialDays: number): Date {
  const now = new Date()
  return new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
}

// Stripe webhook events we handle
export const STRIPE_WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END: 'customer.subscription.trial_will_end',
} as const