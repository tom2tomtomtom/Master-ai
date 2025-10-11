'use client'

import { useState, useEffect } from 'react'
import { appLogger } from '@/lib/logger';
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Crown, 
  Users, 
  Zap, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Settings,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface SubscriptionData {
  tier: string
  status: string
  billingInterval: string | null
  subscriptionEndsAt: string | null
  trialEndsAt: string | null
  tierConfig: {
    name: string
    features: string[]
    price: number | null
    priceAnnual: number | null
    interval: string | null
    trialDays: number | null
  }
  subscription: {
    id: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    trialStart: string | null
    trialEnd: string | null
    cancelAtPeriodEnd: boolean
    canceledAt: string | null
    quantity: number
  } | null
  customer: {
    id: string
    email: string
  } | null
  isActive: boolean
  isTrialing: boolean
  isPastDue: boolean
  isCanceled: boolean
  hasActiveSubscription: boolean
  canUpgrade: boolean
  canManageBilling: boolean
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
  incomplete: 'bg-yellow-100 text-yellow-700',
}

export function SubscriptionWidget() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
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
      appLogger.error('Error fetching subscription data:', { error: error, component: 'subscription-widget' })
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!subscriptionData?.canManageBilling) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create billing portal session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      appLogger.error('Error opening billing portal:', { error: error, component: 'subscription-widget' })
      toast.error('Failed to open billing portal')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpgrade = () => {
    router.push('/dashboard/upgrade')
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  if (!subscriptionData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Failed to load subscription data
        </div>
      </Card>
    )
  }

  const Icon = tierIcons[subscriptionData.tier as keyof typeof tierIcons] || Zap
  const statusColor = statusColors[subscriptionData.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'

  // Calculate trial progress
  const getTrialProgress = () => {
    if (!subscriptionData.isTrialing || !subscriptionData.subscription?.trialEnd) {
      return null
    }

    const trialEnd = new Date(subscriptionData.subscription.trialEnd)
    const trialStart = subscriptionData.subscription.trialStart 
      ? new Date(subscriptionData.subscription.trialStart)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Assume 7 days ago

    const totalDuration = trialEnd.getTime() - trialStart.getTime()
    const elapsed = Date.now() - trialStart.getTime()
    const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

    return {
      progress,
      daysLeft: Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    }
  }

  const trialInfo = getTrialProgress()

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{subscriptionData.tierConfig.name}</h3>
            <div className="flex items-center space-x-2">
              <Badge className={statusColor}>
                {subscriptionData.status}
              </Badge>
              {subscriptionData.billingInterval && (
                <Badge variant="outline">
                  {subscriptionData.billingInterval === 'year' ? 'Annual' : 'Monthly'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          {subscriptionData.tierConfig.price !== null && (
            <div className="text-2xl font-bold">
              ${subscriptionData.billingInterval === 'year' 
                ? Math.round((subscriptionData.tierConfig.priceAnnual || subscriptionData.tierConfig.price) / 12)
                : subscriptionData.tierConfig.price
              }
              <span className="text-sm text-gray-500 font-normal">/month</span>
            </div>
          )}
        </div>
      </div>

      {/* Trial Progress */}
      {subscriptionData.isTrialing && trialInfo && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Free Trial</span>
            <span className="text-sm text-blue-600">
              {trialInfo.daysLeft} days left
            </span>
          </div>
          <Progress value={trialInfo.progress} className="h-2" />
          <p className="text-xs text-blue-600 mt-1">
            Trial ends {formatDistanceToNow(new Date(subscriptionData.subscription!.trialEnd!), { addSuffix: true })}
          </p>
        </div>
      )}

      {/* Status Messages */}
      {subscriptionData.isPastDue && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-700">Payment Past Due</p>
              <p className="text-xs text-red-600">
                Please update your payment method to continue using the service.
              </p>
            </div>
          </div>
        </div>
      )}

      {subscriptionData.subscription?.cancelAtPeriodEnd && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-yellow-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-700">Subscription Ending</p>
              <p className="text-xs text-yellow-600">
                Your subscription will end on {new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Period */}
      {subscriptionData.subscription && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Current period</span>
            <span className="font-medium">
              {new Date(subscriptionData.subscription.currentPeriodStart).toLocaleDateString()} - {' '}
              {new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* Team quantity */}
      {subscriptionData.tier === 'team' && subscriptionData.subscription && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Team members</span>
            <span className="font-medium">{subscriptionData.subscription.quantity}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {subscriptionData.canUpgrade && (
          <Button 
            onClick={handleUpgrade}
            className="flex-1"
            disabled={actionLoading}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        )}

        {subscriptionData.canManageBilling && (
          <Button 
            variant="outline" 
            onClick={handleManageBilling}
            className="flex-1"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            {subscriptionData.tier === 'free' ? 'Start Subscription' : 'Manage Billing'}
          </Button>
        )}

        {subscriptionData.tier === 'free' && (
          <Button onClick={handleUpgrade} className="flex-1">
            <Crown className="h-4 w-4 mr-2" />
            Go Pro
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">
              {subscriptionData.tierConfig.features.length}
            </div>
            <div className="text-xs text-gray-500">Features</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {subscriptionData.isActive ? (
                <CheckCircle className="h-5 w-5 mx-auto" />
              ) : (
                <AlertTriangle className="h-5 w-5 mx-auto" />
              )}
            </div>
            <div className="text-xs text-gray-500">Status</div>
          </div>
        </div>
      </div>
    </Card>
  )
}