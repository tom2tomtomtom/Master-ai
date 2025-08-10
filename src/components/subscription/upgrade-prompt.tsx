'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  Crown, 
  Users, 
  Zap, 
  X, 
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/stripe'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'

interface UpgradePromptProps {
  currentTier: SubscriptionTier
  targetTier?: SubscriptionTier
  context?: string
  compact?: boolean
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

const tierIcons = {
  free: Zap,
  pro: Crown,
  team: Users,
  enterprise: Users,
}

const tierGradients = {
  free: 'from-gray-400 to-gray-500',
  pro: 'from-blue-500 to-purple-600',
  team: 'from-purple-500 to-indigo-600',
  enterprise: 'from-gray-600 to-gray-800',
}

export function UpgradePrompt({
  currentTier,
  targetTier = 'pro',
  context,
  compact = false,
  dismissible = true,
  onDismiss,
  className = '',
}: UpgradePromptProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const targetTierConfig = SUBSCRIPTION_TIERS[targetTier]
  const TargetIcon = tierIcons[targetTier]

  const handleUpgrade = () => {
    if (!user) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href))
      return
    }

    if (targetTier === 'enterprise') {
      router.push('/contact')
    } else {
      router.push('/dashboard/billing')
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  if (isDismissed) {
    return null
  }

  const getPromptMessage = () => {
    if (context) return context

    switch (targetTier) {
      case 'pro':
        return currentTier === 'free' 
          ? 'Unlock all 81 lessons and start earning certificates'
          : 'Upgrade to Pro for full access'
      case 'team':
        return currentTier === 'free'
          ? 'Manage your team and track progress together'
          : 'Upgrade to Team for advanced collaboration features'
      case 'enterprise':
        return 'Get custom training and dedicated support'
      default:
        return 'Upgrade for more features'
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center justify-between p-3 bg-gradient-to-r ${tierGradients[targetTier]} text-white rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <TargetIcon className="h-5 w-5" />
          <div>
            <p className="font-medium text-sm">{getPromptMessage()}</p>
            {targetTierConfig.price && (
              <p className="text-xs opacity-90">
                Starting at ${targetTierConfig.price}/month
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUpgrade}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            Upgrade
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${tierGradients[targetTier]} opacity-10`} />
      
      {dismissible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="relative p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-3 bg-gradient-to-r ${tierGradients[targetTier]} rounded-lg text-white`}>
            <TargetIcon className="h-6 w-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg">
                Upgrade to {targetTierConfig.name}
              </h3>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                <Star className="h-3 w-3 mr-1" />
                Popular
              </Badge>
            </div>
            
            <p className="text-gray-600 mb-4">
              {getPromptMessage()}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {targetTierConfig.features.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Sparkles className="h-4 w-4 text-blue-500 mr-2" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div>
                {targetTierConfig.price && (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">
                      ${targetTierConfig.price}
                    </span>
                    <span className="text-gray-500">/month</span>
                    {'trialDays' in targetTierConfig && targetTierConfig.trialDays && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {targetTierConfig.trialDays}-day trial
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <Button onClick={handleUpgrade} className="ml-4">
                <TargetIcon className="h-4 w-4 mr-2" />
                {targetTier === 'enterprise' ? 'Contact Sales' : 'Upgrade Now'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}