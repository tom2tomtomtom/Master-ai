import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// This is critical for webhook verification

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'

async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw new Error('Invalid webhook signature')
  }
}

async function logWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        data: event.data as any,
        processed: false,
      },
    })
  } catch (error) {
    console.error('Failed to log webhook event:', error)
  }
}

async function markEventProcessed(
  eventId: string,
  error?: string
): Promise<void> {
  try {
    await prisma.stripeWebhookEvent.update({
      where: { stripeEventId: eventId },
      data: {
        processed: !error,
        processingError: error || null,
        updatedAt: new Date(),
      },
    })
  } catch (updateError) {
    console.error('Failed to update webhook event status:', updateError)
  }
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const customerId = subscription.customer as string
  const subscriptionId = subscription.id

  // Get customer details
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  
  if (!customer.metadata?.userId) {
    throw new Error(`No userId found in customer metadata for ${customerId}`)
  }

  const userId = customer.metadata.userId

  // Extract subscription details
  const priceId = subscription.items.data[0]?.price?.id
  let tier = 'free'
  let billingInterval: string | null = null

  // Determine tier based on price ID
  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID) {
    tier = 'pro'
    billingInterval = 'month'
  } else if (priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) {
    tier = 'pro'
    billingInterval = 'year'
  } else if (priceId === process.env.STRIPE_TEAM_MONTHLY_PRICE_ID) {
    tier = 'team'
    billingInterval = 'month'
  } else if (priceId === process.env.STRIPE_TEAM_ANNUAL_PRICE_ID) {
    tier = 'team'
    billingInterval = 'year'
  }

  // Create or update Stripe customer record
  await prisma.stripeCustomer.upsert({
    where: { stripeCustomerId: customerId },
    create: {
      userId,
      stripeCustomerId: customerId,
      email: customer.email || '',
    },
    update: {
      email: customer.email || '',
    },
  })

  // Create subscription record
  await prisma.stripeSubscription.create({
    data: {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      userId,
      status: subscription.status,
      tier,
      billingInterval,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      trialStart: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null,
      trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      quantity: (subscription as any).quantity || 1,
      metadata: (subscription as any).metadata || {},
    },
  })

  // Update user subscription info
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier,
      subscriptionStatus: subscription.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      billingInterval,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  })
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const subscriptionId = subscription.id

  // Update subscription record
  const existingSubscription = await prisma.stripeSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!existingSubscription) {
    console.warn(`Subscription ${subscriptionId} not found in database`)
    return
  }

  await prisma.stripeSubscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      trialStart: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null,
      trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
      quantity: (subscription as any).quantity || 1,
      metadata: (subscription as any).metadata || {},
    },
  })

  // Update user subscription info
  await prisma.user.update({
    where: { id: existingSubscription.userId },
    data: {
      subscriptionStatus: subscription.status,
      subscriptionEndsAt: (subscription as any).cancel_at_period_end 
        ? new Date((subscription as any).current_period_end * 1000) 
        : null,
      trialEndsAt: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
    },
  })
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const subscriptionId = subscription.id

  const existingSubscription = await prisma.stripeSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!existingSubscription) {
    console.warn(`Subscription ${subscriptionId} not found in database`)
    return
  }

  // Update subscription record
  await prisma.stripeSubscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: 'canceled',
      endedAt: new Date(subscription.ended_at! * 1000),
      canceledAt: new Date(subscription.canceled_at! * 1000),
    },
  })

  // Update user to free tier
  await prisma.user.update({
    where: { id: existingSubscription.userId },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      subscriptionEndsAt: new Date(subscription.ended_at! * 1000),
      stripeSubscriptionId: null,
    },
  })
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  const invoiceId = invoice.id as string
  const customerId = invoice.customer as string
  const subscriptionId = (invoice as any).subscription as string | null

  // Find user by customer ID
  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!stripeCustomer) {
    console.warn(`Stripe customer ${customerId} not found in database`)
    return
  }

  // Upsert invoice record
  await prisma.stripeInvoice.upsert({
    where: { stripeInvoiceId: invoiceId },
    create: {
      stripeInvoiceId: invoiceId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      userId: stripeCustomer.userId,
      status: invoice.status || 'paid',
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      currency: invoice.currency,
      description: invoice.description,
      invoiceUrl: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      paymentIntentId: (invoice as any).payment_intent as string | null,
      periodStart: (invoice as any).period_start ? new Date((invoice as any).period_start * 1000) : null,
      periodEnd: (invoice as any).period_end ? new Date((invoice as any).period_end * 1000) : null,
      paidAt: (invoice as any).status_transitions?.paid_at ? new Date((invoice as any).status_transitions.paid_at * 1000) : null,
      dueDate: (invoice as any).due_date ? new Date((invoice as any).due_date * 1000) : null,
      attemptCount: (invoice as any).attempt_count || 0,
      metadata: (invoice as any).metadata || {},
    },
    update: {
      status: invoice.status || 'paid',
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
      attemptCount: (invoice as any).attempt_count || 0,
    },
  })

  // If subscription is past due, reactivate it
  if (subscriptionId) {
    const subscription = await prisma.stripeSubscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    })

    if (subscription && subscription.status === 'past_due') {
      await prisma.stripeSubscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'active' },
      })

      await prisma.user.update({
        where: { id: subscription.userId },
        data: { subscriptionStatus: 'active' },
      })
    }
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const invoiceId = invoice.id as string
  const customerId = invoice.customer as string
  const subscriptionId = (invoice as any).subscription as string | null

  // Find user by customer ID
  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!stripeCustomer) {
    console.warn(`Stripe customer ${customerId} not found in database`)
    return
  }

  // Update invoice record
  await prisma.stripeInvoice.upsert({
    where: { stripeInvoiceId: invoiceId },
    create: {
      stripeInvoiceId: invoiceId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      userId: stripeCustomer.userId,
      status: invoice.status || 'open',
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      currency: invoice.currency,
      description: invoice.description,
      invoiceUrl: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      paymentIntentId: (invoice as any).payment_intent as string | null,
      periodStart: (invoice as any).period_start ? new Date((invoice as any).period_start * 1000) : null,
      periodEnd: (invoice as any).period_end ? new Date((invoice as any).period_end * 1000) : null,
      dueDate: (invoice as any).due_date ? new Date((invoice as any).due_date * 1000) : null,
      attemptCount: (invoice as any).attempt_count || 0,
      metadata: (invoice as any).metadata || {},
    },
    update: {
      status: invoice.status || 'open',
      attemptCount: (invoice as any).attempt_count || 0,
    },
  })

  // Update subscription status to past_due if applicable
  if (subscriptionId) {
    await prisma.stripeSubscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: 'past_due' },
    })

    await prisma.user.update({
      where: { id: stripeCustomer.userId },
      data: { subscriptionStatus: 'past_due' },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
    }

    const event = await verifyWebhookSignature(body, signature)
    
    // Log the event for debugging
    await logWebhookEvent(event)

    try {
      // Process the event
      switch (event.type) {
        case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
          await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
          break

        case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
          break

        case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
          break

        case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END:
          // Handle trial ending - could send email notification
          console.log('Trial will end for subscription:', event.data.object)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      // Mark event as processed
      await markEventProcessed(event.id)

      return NextResponse.json({ received: true })
    } catch (processingError) {
      console.error('Error processing webhook event:', processingError)
      
      // Mark event as failed
      await markEventProcessed(event.id, processingError instanceof Error ? processingError.message : 'Unknown error')
      
      return NextResponse.json(
        { error: 'Failed to process webhook event' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    )
  }
}