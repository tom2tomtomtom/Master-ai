import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase-auth-middleware'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const cancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true),
  reason: z.string().optional(),
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
    const { cancelAtPeriodEnd, reason } = cancelSubscriptionSchema.parse(body)

    // Get user with current subscription
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
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

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentSubscription = dbUser.stripeSubscriptions[0]

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    let updatedSubscription

    if (cancelAtPeriodEnd) {
      // Cancel at period end (user keeps access until period ends)
      updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
          metadata: {
            ...(currentSubscription.metadata as Record<string, any> || {}),
            cancellationReason: reason || 'User requested cancellation',
            cancelledAt: new Date().toISOString(),
            cancelledBy: user.id,
          }
        }
      )
    } else {
      // Cancel immediately
      updatedSubscription = await stripe.subscriptions.cancel(
        currentSubscription.stripeSubscriptionId,
        {
          prorate: true,
        }
      )
    }

    // The webhook will handle updating the database records

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: (updatedSubscription as any).cancel_at_period_end,
        currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
        canceledAt: (updatedSubscription as any).canceled_at ? new Date((updatedSubscription as any).canceled_at * 1000) : null,
        endedAt: (updatedSubscription as any).ended_at ? new Date((updatedSubscription as any).ended_at * 1000) : null,
      }
    })

  } catch (error) {
    console.error('Error cancelling subscription:', error)

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
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

// Reactivate a cancelled subscription (only if cancel_at_period_end is true)
export async function PATCH(_req: NextRequest) {
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

    // Get user with current subscription
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        stripeSubscriptions: {
          where: {
            status: {
              in: ['active', 'trialing']
            },
            cancelAtPeriodEnd: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentSubscription = dbUser.stripeSubscriptions[0]

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No subscription scheduled for cancellation found' },
        { status: 400 }
      )
    }

    // Reactivate the subscription
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
        metadata: {
          ...(currentSubscription.metadata as Record<string, any> || {}),
          reactivatedAt: new Date().toISOString(),
          reactivatedBy: user.id,
        }
      }
    )

    // The webhook will handle updating the database records

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: (updatedSubscription as any).cancel_at_period_end,
        currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
      }
    })

  } catch (error) {
    console.error('Error reactivating subscription:', error)

    // Handle Stripe errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any
      return NextResponse.json(
        { error: stripeError.message || 'Stripe error occurred' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}