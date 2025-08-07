'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Crown, Users, Zap, Loader2 } from 'lucide-react'
import { SUBSCRIPTION_TIERS, BillingInterval } from '@/lib/stripe'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface PricingCardProps {
  tier: keyof typeof SUBSCRIPTION_TIERS
  interval: BillingInterval
  currentTier?: string
  isCurrentPlan?: boolean
  quantity?: number
  onUpgrade?: (tier: string, interval: BillingInterval, quantity?: number) => Promise<void>
  loading?: boolean
}

const tierIcons = {
  free: Zap,
  pro: Crown,
  team: Users,
  enterprise: Users,
}

const tierColors = {
  free: 'bg-gray-100 text-gray-700',
  pro: 'bg-blue-100 text-blue-700',
  team: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-gray-100 text-gray-700',
}

export function PricingCard({
  tier,
  interval,
  currentTier,
  isCurrentPlan = false,
  quantity = 1,
  onUpgrade,
  loading = false,
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  const tierConfig = SUBSCRIPTION_TIERS[tier]
  const Icon = tierIcons[tier]

  const isPopular = tier === 'pro'
  const isEnterprise = tier === 'enterprise'
  const canUpgrade = currentTier === 'free' || (currentTier === 'pro' && tier === 'team')
  const isDowngrade = (currentTier === 'team' && tier === 'pro') || 
                     ((currentTier === 'pro' || currentTier === 'team') && tier === 'free')

  // Calculate price
  const getPrice = () => {
    if (tier === 'free' || isEnterprise) return null
    
    const basePrice = interval === 'year' && 'priceAnnual' in tierConfig 
      ? tierConfig.priceAnnual! 
      : tierConfig.price!
    
    return tier === 'team' ? basePrice * quantity : basePrice
  }

  const price = getPrice()
  
  // Calculate savings for annual billing
  const getSavings = () => {
    if (interval !== 'year' || !price || tier === 'free' || isEnterprise) return null
    
    const monthlyTotal = tierConfig.price! * 12 * (tier === 'team' ? quantity : 1)
    const savings = monthlyTotal - price
    const percentage = Math.round((savings / monthlyTotal) * 100)
    
    return { amount: savings, percentage }
  }

  const savings = getSavings()

  const handleAction = async () => {
    if (isLoading || loading) return

    // If not authenticated, redirect to sign up
    if (!session) {
      const planParam = tier !== 'free' ? `?plan=${tier}` : ''
      router.push(`/auth/signup${planParam}`)
      return
    }

    // If it's enterprise, redirect to contact
    if (isEnterprise) {
      router.push('/contact')
      return
    }

    // If it's free tier, redirect to dashboard
    if (tier === 'free') {
      router.push('/dashboard')
      return
    }

    // If current plan, go to billing
    if (isCurrentPlan) {
      router.push('/dashboard/billing')
      return
    }

    // Handle upgrade/subscription creation
    if (onUpgrade) {
      setIsLoading(true)
      try {
        await onUpgrade(tier, interval, tier === 'team' ? quantity : undefined)
      } catch (error) {
        console.error('Upgrade failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const getButtonText = () => {
    if (isCurrentPlan) {
      return 'Manage Subscription'
    }
    
    if (!session) {
      return tier === 'free' ? 'Get Started Free' : 'Start Free Trial'
    }
    
    if (isEnterprise) {
      return 'Contact Sales'
    }
    
    if (tier === 'free') {
      return 'Current Plan'
    }
    
    if (canUpgrade) {
      return currentTier === 'free' ? 'Upgrade Now' : 'Upgrade Plan'
    }
    
    if (isDowngrade) {
      return 'Downgrade'
    }
    
    return 'Select Plan'
  }

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'outline'
    if (tier === 'free' && currentTier === 'free') return 'outline'
    if (isPopular && !isCurrentPlan) return 'default'
    return 'outline'
  }

  return (
    <Card className={`relative p-6 ${isPopular ? 'border-2 border-blue-500 shadow-lg' : 'border-2 border-gray-200'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Current Plan
          </Badge>
        </div>
      )}

      <div className="text-center">
        {/* Icon and Title */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${tierColors[tier]}`}>
          <Icon className="h-8 w-8" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{tierConfig.name}</h3>

        {/* Price */}
        <div className="mb-4">
          {price !== null ? (
            <>
              <div className="text-3xl font-bold mb-1">
                ${interval === 'year' ? Math.round(price / 12) : price}
                {tier === 'team' && quantity > 1 && (
                  <span className="text-lg text-gray-500">/{quantity} users</span>
                )}
              </div>
              <div className="text-gray-500 text-sm">
                {interval === 'year' ? '/user/month (billed annually)' : '/user/month'}
              </div>
              {savings && (
                <div className="text-green-600 text-sm font-medium mt-1">
                  Save ${savings.amount} ({savings.percentage}% off)
                </div>
              )}
            </>
          ) : (
            <div className="text-3xl font-bold mb-1">
              {tier === 'free' ? '$0' : 'Custom'}
            </div>
          )}
        </div>

        {/* Trial info for Pro */}
        {'trialDays' in tierConfig && tierConfig.trialDays && interval === 'month' && (
          <div className="mb-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {tierConfig.trialDays}-day free trial
            </Badge>
          </div>
        )}

        {/* Features */}
        <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
          {tierConfig.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Action Button */}
        <Button
          className="w-full"
          variant={getButtonVariant()}
          onClick={handleAction}
          disabled={isLoading || loading || (tier === 'free' && currentTier === 'free' && !isCurrentPlan)}
        >
          {(isLoading || loading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {getButtonText()}
        </Button>

        {/* Additional info */}
        {tier !== 'free' && !isEnterprise && (
          <p className="text-xs text-gray-500 mt-3">
            Cancel anytime. No contracts.
          </p>
        )}
      </div>
    </Card>
  )
}