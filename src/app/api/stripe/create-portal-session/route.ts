import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { returnUrl } = createPortalSessionSchema.parse(body)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        stripeCustomer: true,
      },
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

    // Prepare return URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const defaultReturnUrl = `${baseUrl}/dashboard/billing`

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomer.stripeCustomerId,
      return_url: returnUrl || defaultReturnUrl,
    })

    return NextResponse.json({
      url: portalSession.url,
    })

  } catch (error) {
    console.error('Error creating portal session:', error)

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