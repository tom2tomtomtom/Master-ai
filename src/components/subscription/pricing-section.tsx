'use client'

import { useState, useEffect } from 'react'
import { appLogger } from '@/lib/logger';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PricingCard } from './pricing-card'
import { SUBSCRIPTION_TIERS, BillingInterval } from '@/lib/stripe'
import { useAuth } from '@/components/providers/safe-auth-provider'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface SubscriptionData {
  tier: string
  status: string
  isActive: boolean
  hasActiveSubscription: boolean
  canUpgrade: boolean
}

interface PricingSectionProps {
  currentSubscription?: SubscriptionData
  showTitle?: boolean
  embedded?: boolean
}

export function PricingSection({ 
  currentSubscription, 
  showTitle = true,
  embedded = false 
}: PricingSectionProps) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month')
  const [teamQuantity, setTeamQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleUpgrade = async (tier: string, interval: BillingInterval, quantity?: number) => {
    if (!user) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)
      return
    }

    setLoading(true)
    try {
      // Check if user already has a subscription and needs to upgrade
      if (currentSubscription?.hasActiveSubscription) {
        // Use upgrade API
        const response = await fetch('/api/subscriptions/upgrade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tier,
            interval,
            quantity: quantity || 1,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upgrade subscription')
        }

        toast.success('Subscription upgraded successfully!')
        router.refresh()
      } else {
        // Use checkout session API for new subscriptions
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tier,
            interval,
            quantity: quantity || 1,
            successUrl: `${window.location.origin}/dashboard?subscription=success`,
            cancelUrl: `${window.location.origin}/dashboard?subscription=cancelled`,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create checkout session')
        }

        const { url } = await response.json()
        
        if (url) {
          window.location.href = url
        } else {
          throw new Error('No checkout URL received')
        }
      }
    } catch (error) {
      appLogger.error('Upgrade error:', { error: error, component: 'pricing-section' })
      toast.error(error instanceof Error ? error.message : 'Failed to process upgrade')
    } finally {
      setLoading(false)
    }
  }

  const tiers = ['free', 'pro', 'team', 'enterprise'] as const

  return (
    <section className={`${embedded ? '' : 'py-20 bg-gray-50'}`}>
      <div className="container mx-auto px-4">
        {showTitle && (
          <>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Choose Your AI Mastery Plan
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Start free and upgrade as you grow your AI expertise
            </p>
          </>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 border">
            <Button
              variant={billingInterval === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingInterval('month')}
            >
              Monthly
            </Button>
            <Button
              variant={billingInterval === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingInterval('year')}
              className="relative"
            >
              Annual
              <Badge 
                variant="secondary" 
                className="ml-2 bg-green-100 text-green-700 text-xs"
              >
                Save 17%
              </Badge>
            </Button>
          </div>
        </div>

        {/* Team Quantity Selector */}
        {billingInterval && (
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-4 border max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Size (for Team plan)
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTeamQuantity(Math.max(1, teamQuantity - 1))}
                  disabled={teamQuantity <= 1}
                >
                  -
                </Button>
                <span className="text-lg font-medium w-12 text-center">
                  {teamQuantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTeamQuantity(Math.min(100, teamQuantity + 1))}
                  disabled={teamQuantity >= 100}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                You can change this later
              </p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <PricingCard
              key={tier}
              tier={tier}
              interval={billingInterval}
              currentTier={currentSubscription?.tier}
              isCurrentPlan={currentSubscription?.tier === tier && currentSubscription?.isActive}
              quantity={tier === 'team' ? teamQuantity : 1}
              onUpgrade={handleUpgrade}
              loading={loading}
            />
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-12 text-center">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">30-day</div>
              <div className="text-gray-600">Money-back guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24/7</div>
              <div className="text-gray-600">Customer support</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">No</div>
              <div className="text-gray-600">Setup fees</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Can I change my plan anytime?</h4>
              <p className="text-gray-600 text-sm">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time. 
                Changes take effect immediately with prorated billing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What's included in the free trial?</h4>
              <p className="text-gray-600 text-sm">
                The Pro plan includes a 7-day free trial with full access to all features. 
                No credit card required during the trial period.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">How does team billing work?</h4>
              <p className="text-gray-600 text-sm">
                Team plans are billed per user per month. You can add or remove team members 
                anytime, and billing adjusts automatically.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Is there a contract or commitment?</h4>
              <p className="text-gray-600 text-sm">
                No contracts required. All plans are month-to-month or annual with the option 
                to cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}