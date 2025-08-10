import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase-auth-middleware'
import { stripe, getPriceId, BillingInterval } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const createCheckoutSessionSchema = z.object({
  tier: z.enum(['pro', 'team']),
  interval: z.enum(['month', 'year']).default('month'),
  quantity: z.number().min(1).max(100).default(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
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

    const user = await requireAuth()

    const body = await req.json()
    const { tier, interval, quantity, successUrl, cancelUrl } = createCheckoutSessionSchema.parse(body)

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has an active subscription
    if (dbUser.subscriptionStatus === 'active' && dbUser.subscriptionTier !== 'free') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Validate tier and get price ID
    const priceId = getPriceId(tier, interval as BillingInterval)
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid subscription tier or interval' },
        { status: 400 }
      )
    }

    // Create or retrieve Stripe customer
    const stripeCustomer = await prisma.stripeCustomer.findUnique({
      where: { userId: dbUser.id },
    })

    let customerId: string

    if (stripeCustomer) {
      customerId = stripeCustomer.stripeCustomerId
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name || undefined,
        metadata: {
          userId: dbUser.id,
        },
      })

      customerId = customer.id

      // Save customer to database
      await prisma.stripeCustomer.create({
        data: {
          userId: dbUser.id,
          stripeCustomerId: customerId,
          email: dbUser.email,
        },
      })

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Prepare checkout session parameters
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const defaultSuccessUrl = `${baseUrl}/dashboard?subscription=success`
    const defaultCancelUrl = `${baseUrl}/dashboard?subscription=cancelled`

    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: tier === 'team' ? quantity : 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        userId: dbUser.id,
        tier,
        interval,
        quantity: quantity.toString(),
      },
      subscription_data: {
        metadata: {
          userId: dbUser.id,
          tier,
          interval,
        },
      },
    }

    // Add trial period for Pro tier (first-time users only)
    if (tier === 'pro' && interval === 'month') {
      // Check if user has ever had a subscription
      const hasHadSubscription = await prisma.stripeSubscription.findFirst({
        where: { userId: dbUser.id },
      })

      if (!hasHadSubscription) {
        sessionParams.subscription_data.trial_period_days = 7
        sessionParams.subscription_data.trial_settings = {
          end_behavior: {
            missing_payment_method: 'pause',
          },
        }
      }
    }

    // For team subscriptions, enable quantity adjustment
    if (tier === 'team') {
      sessionParams.line_items[0].adjustable_quantity = {
        enabled: true,
        minimum: 1,
        maximum: 100,
      }
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}