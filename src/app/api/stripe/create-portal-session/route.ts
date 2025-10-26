import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase-auth-middleware'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { appLogger } from '@/lib/logger'
import { z } from 'zod'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const createPortalSessionSchema = z.object({
  returnUrl: z.string().url().optional(),
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
    const { returnUrl } = createPortalSessionSchema.parse(body)

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        stripeCustomer: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!dbUser.stripeCustomer) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please create a subscription first.' },
        { status: 400 }
      )
    }

    // Prepare return URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const defaultReturnUrl = `${baseUrl}/dashboard/billing`

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomer.stripeCustomerId,
      return_url: returnUrl || defaultReturnUrl,
    })

    return NextResponse.json({
      url: portalSession.url,
    })

  } catch (error) {
    appLogger.errors.apiError('stripe-portal-session', error as Error, { 
      endpoint: '/api/stripe/create-portal-session'
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}