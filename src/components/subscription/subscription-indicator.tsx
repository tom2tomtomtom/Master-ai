'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Users, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/stripe'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface SubscriptionData {
  tier: string
  status: string
  billingInterval: string | null
  trialEndsAt: string | null
  subscription: {
    currentPeriodEnd: string
    trialEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
  isActive: boolean
  isTrialing: boolean
  isPastDue: boolean
  canUpgrade: boolean
}

const tierIcons = {
  free: Zap,
  pro: Crown,
  team: Users,
  enterprise: Users,
}

const statusColors = {
  active: 'bg-green-100 text-green-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-red-100 text-red-700',
  canceled: 'bg-gray-100 text-gray-700',
}

export function SubscriptionIndicator() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscriptions/current')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData(data)
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = () => {
    router.push('/dashboard/billing')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!subscriptionData) {
    return null
  }

  const Icon = tierIcons[subscriptionData.tier as keyof typeof tierIcons] || Zap
  const tierConfig = SUBSCRIPTION_TIERS[subscriptionData.tier as SubscriptionTier]
  const statusColor = statusColors[subscriptionData.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'

  // Show trial countdown for trialing users
  if (subscriptionData.isTrialing && subscriptionData.subscription?.trialEnd) {
    const trialEnd = new Date(subscriptionData.subscription.trialEnd)
    const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-blue-100 rounded">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{tierConfig.name}</p>
            <p className="text-xs text-gray-500">Free Trial</p>
          </div>
        </div>

        <div className="p-2 bg-blue-50 rounded border-l-2 border-blue-400">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">
              {daysLeft} days left
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Trial ends {formatDistanceToNow(trialEnd, { addSuffix: true })}
          </p>
        </div>

        <Button onClick={handleUpgrade} size="sm" className="w-full text-xs">
          <Crown className="h-3 w-3 mr-1" />
          Continue Subscription
        </Button>
      </div>
    )
  }

  // Show past due warning
  if (subscriptionData.isPastDue) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-red-100 rounded">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{tierConfig.name}</p>
            <Badge className={statusColor}>
              Payment Due
            </Badge>
          </div>
        </div>

        <div className="p-2 bg-red-50 rounded border-l-2 border-red-400">
          <p className="text-xs text-red-700">
            Please update your payment method to continue using the service.
          </p>
        </div>

        <Button onClick={handleUpgrade} size="sm" className="w-full text-xs" variant="destructive">
          Update Payment
        </Button>
      </div>
    )
  }

  // Show cancellation notice
  if (subscriptionData.subscription?.cancelAtPeriodEnd) {
    const periodEnd = new Date(subscriptionData.subscription.currentPeriodEnd)
    
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-yellow-100 rounded">
            <Icon className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{tierConfig.name}</p>
            <Badge className="bg-yellow-100 text-yellow-700">
              Ending Soon
            </Badge>
          </div>
        </div>

        <div className="p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
          <p className="text-xs text-yellow-700">
            Ends {formatDistanceToNow(periodEnd, { addSuffix: true })}
          </p>
        </div>

        <Button onClick={handleUpgrade} size="sm" className="w-full text-xs" variant="outline">
          Reactivate
        </Button>
      </div>
    )
  }

  // Regular subscription display
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className={`p-1 ${subscriptionData.tier === 'free' ? 'bg-gray-100' : 'bg-blue-100'} rounded`}>
          <Icon className={`h-4 w-4 ${subscriptionData.tier === 'free' ? 'text-gray-600' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{tierConfig.name}</p>
          <div className="flex items-center space-x-1">
            {subscriptionData.isActive ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <div className="h-3 w-3 rounded-full bg-gray-300" />
            )}
            <span className="text-xs text-gray-500 capitalize">
              {subscriptionData.status}
            </span>
            {subscriptionData.billingInterval && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {subscriptionData.billingInterval === 'year' ? 'Annual' : 'Monthly'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {subscriptionData.canUpgrade && (
        <Button onClick={handleUpgrade} size="sm" variant="outline" className="w-full text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          {subscriptionData.tier === 'free' ? 'Upgrade Plan' : 'Manage Billing'}
        </Button>
      )}

      {/* Next billing date for active subscriptions */}
      {subscriptionData.isActive && subscriptionData.subscription && (
        <div className="text-xs text-gray-500">
          <p>
            Next billing: {new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  )
}