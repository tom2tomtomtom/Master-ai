import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase-auth-middleware'
import { prisma } from '@/lib/prisma'
import { appLogger } from '@/lib/logger'
import { SUBSCRIPTION_TIERS } from '@/lib/stripe'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser()
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with subscription details
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        stripeCustomer: true,
        stripeSubscriptions: {
          where: {
            status: {
              in: ['active', 'trialing', 'past_due']
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentSubscription = user.stripeSubscriptions[0] || null
    const tierConfig = SUBSCRIPTION_TIERS[user.subscriptionTier as keyof typeof SUBSCRIPTION_TIERS]

    const subscriptionData = {
      // User subscription info
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      billingInterval: user.billingInterval,
      subscriptionEndsAt: user.subscriptionEndsAt,
      trialEndsAt: user.trialEndsAt,
      
      // Tier configuration
      tierConfig: {
        name: tierConfig.name,
        features: tierConfig.features,
        price: tierConfig.price,
        priceAnnual: 'priceAnnual' in tierConfig ? tierConfig.priceAnnual : null,
        interval: tierConfig.interval,
        trialDays: 'trialDays' in tierConfig ? tierConfig.trialDays : null,
      },

      // Subscription details (if exists)
      subscription: currentSubscription ? {
        id: currentSubscription.stripeSubscriptionId,
        status: currentSubscription.status,
        currentPeriodStart: currentSubscription.currentPeriodStart,
        currentPeriodEnd: currentSubscription.currentPeriodEnd,
        trialStart: currentSubscription.trialStart,
        trialEnd: currentSubscription.trialEnd,
        cancelAtPeriodEnd: currentSubscription.cancelAtPeriodEnd,
        canceledAt: currentSubscription.canceledAt,
        quantity: currentSubscription.quantity,
      } : null,

      // Customer info
      customer: user.stripeCustomer ? {
        id: user.stripeCustomer.stripeCustomerId,
        email: user.stripeCustomer.email,
      } : null,

      // Calculated fields
      isActive: user.subscriptionStatus === 'active',
      isTrialing: user.subscriptionStatus === 'trialing',
      isPastDue: user.subscriptionStatus === 'past_due',
      isCanceled: user.subscriptionStatus === 'canceled',
      hasActiveSubscription: currentSubscription !== null,
      canUpgrade: user.subscriptionTier === 'free' || user.subscriptionTier === 'pro',
      canManageBilling: user.stripeCustomerId !== null,
    }

    return NextResponse.json(subscriptionData)

  } catch (error) {
    appLogger.errors.apiError('subscription-current', error as Error, {
      endpoint: '/api/subscriptions/current'
    })
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}