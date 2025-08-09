import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase-auth-middleware'
import { authOptions } from '@/lib/auth'
import { stripe, getPriceId, BillingInterval } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const upgradeSubscriptionSchema = z.object({
  tier: z.enum(['pro', 'team']),
  interval: z.enum(['month', 'year']).default('month'),
  quantity: z.number().min(1).max(100).default(1),
  prorationBehavior: z.enum(['create_prorations', 'none']).default('create_prorations'),
})

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { tier, interval, quantity, prorationBehavior } = upgradeSubscriptionSchema.parse(body)

    // Get user with current subscription
    const user = await prisma.user.findUnique({
      where: { id: user.id },
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

    if (!user.stripeCustomer) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please create a subscription first.' },
        { status: 400 }
      )
    }

    const currentSubscription = user.stripeSubscriptions[0]

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found. Please create a subscription first.' },
        { status: 400 }
      )
    }

    // Get new price ID
    const newPriceId = getPriceId(tier, interval as BillingInterval)
    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Invalid subscription tier or interval' },
        { status: 400 }
      )
    }

    // Get current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId
    )

    // Check if it's actually an upgrade/change
    const currentPriceId = stripeSubscription.items.data[0]?.price?.id
    if (currentPriceId === newPriceId && (stripeSubscription as any).quantity === quantity) {
      return NextResponse.json(
        { error: 'Subscription is already on the requested plan' },
        { status: 400 }
      )
    }

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
            quantity: tier === 'team' ? quantity : 1,
          }
        ],
        proration_behavior: prorationBehavior,
        metadata: {
          userId: user.id,
          tier,
          interval,
          previousTier: currentSubscription.tier,
          upgradeTimestamp: new Date().toISOString(),
        }
      }
    )

    // The webhook will handle updating the database records
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodStart: new Date((updatedSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
        tier,
        interval,
        quantity: (updatedSubscription as any).quantity,
      }
    })

  } catch (error) {
    console.error('Error upgrading subscription:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      )
    }

    // Handle Stripe errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any
      return NextResponse.json(
        { error: stripeError.message || 'Stripe error occurred' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    )
  }
}