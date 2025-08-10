'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Lock, 
  Crown, 
  Users, 
  Zap, 
  ArrowRight, 
  Star,
  CheckCircle,
  X 
} from 'lucide-react'
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/stripe'
import { getUpgradeMessage, FeatureKey } from '@/lib/subscription-access'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'

interface SubscriptionGateProps {
  feature: FeatureKey
  currentTier: SubscriptionTier
  requiredTier: SubscriptionTier
  title?: string
  description?: string
  children?: React.ReactNode
  inline?: boolean
  showDialog?: boolean
  onClose?: () => void
}

const tierIcons = {
  free: Zap,
  pro: Crown,
  team: Users,
  enterprise: Users,
}

const tierColors = {
  free: 'text-gray-600',
  pro: 'text-blue-600',
  team: 'text-purple-600',
  enterprise: 'text-gray-600',
}

export function SubscriptionGate({
  feature,
  currentTier,
  requiredTier,
  title,
  description,
  children,
  inline = false,
  showDialog = false,
  onClose,
}: SubscriptionGateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(showDialog)
  const router = useRouter()
  const { user } = useAuth()

  const requiredTierConfig = SUBSCRIPTION_TIERS[requiredTier]
  const RequiredIcon = tierIcons[requiredTier]
  const defaultTitle = title || `${requiredTierConfig.name} Feature`
  const defaultDescription = description || getUpgradeMessage(feature, currentTier)

  const handleUpgrade = () => {
    if (!user) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href))
      return
    }

    if (requiredTier === 'enterprise') {
      router.push('/contact')
    } else {
      router.push('/dashboard/billing')
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    onClose?.()
  }

  if (inline) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Lock className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{defaultTitle}</p>
            <p className="text-sm text-gray-600">{defaultDescription}</p>
          </div>
        </div>
        <Button onClick={handleUpgrade} size="sm">
          <RequiredIcon className="h-4 w-4 mr-2" />
          Upgrade
        </Button>
      </div>
    )
  }

  const content = (
    <Card className="p-8 text-center max-w-md mx-auto">
      <div className="mb-6">
        <div className="relative mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-10 w-10 text-gray-400" />
          <div className={`absolute -bottom-2 -right-2 p-1 bg-white rounded-full shadow-lg ${tierColors[requiredTier]}`}>
            <RequiredIcon className="h-5 w-5" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{defaultTitle}</h3>
        <p className="text-gray-600">{defaultDescription}</p>
      </div>

      <div className="mb-6">
        <Badge variant="outline" className="mb-4">
          <RequiredIcon className="h-4 w-4 mr-2" />
          {requiredTierConfig.name} Required
        </Badge>

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Upgrade benefits:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {requiredTierConfig.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <Button onClick={handleUpgrade} className="w-full">
          <RequiredIcon className="h-4 w-4 mr-2" />
          {requiredTier === 'enterprise' ? 'Contact Sales' : `Upgrade to ${requiredTierConfig.name}`}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        {requiredTierConfig.price && (
          <p className="text-sm text-gray-500">
            Starting at ${requiredTierConfig.price}/month
            {'trialDays' in requiredTierConfig && requiredTierConfig.trialDays && (
              <span className="text-blue-600"> • {requiredTierConfig.trialDays}-day free trial</span>
            )}
          </p>
        )}
      </div>

      {children}
    </Card>
  )

  if (showDialog || isDialogOpen) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-gray-500" />
                {defaultTitle}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseDialog}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              {defaultDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-3">
                <RequiredIcon className="h-4 w-4 mr-2" />
                {requiredTierConfig.name} Required
              </Badge>

              <div className="space-y-2">
                <h4 className="font-semibold">What you'll get:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {requiredTierConfig.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button onClick={handleCloseDialog} variant="outline" className="flex-1">
                Maybe Later
              </Button>
              <Button onClick={handleUpgrade} className="flex-1">
                <RequiredIcon className="h-4 w-4 mr-2" />
                {requiredTier === 'enterprise' ? 'Contact Sales' : 'Upgrade Now'}
              </Button>
            </div>

            {requiredTierConfig.price && (
              <p className="text-center text-sm text-gray-500">
                Starting at ${requiredTierConfig.price}/month
                {'trialDays' in requiredTierConfig && requiredTierConfig.trialDays && (
                  <span className="block text-blue-600">{requiredTierConfig.trialDays}-day free trial included</span>
                )}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return content
}