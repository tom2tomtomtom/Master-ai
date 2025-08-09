'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Crown, CreditCard } from 'lucide-react'

interface SubscriptionSectionProps {
  profile: {
    subscriptionTier: string
    subscriptionStatus: string
    createdAt: string
  }
}

const subscriptionTiers = {
  free: { name: 'Free Explorer', color: 'bg-gray-100 text-gray-800' },
  pro: { name: 'Pro', color: 'bg-blue-100 text-blue-800' },
  team: { name: 'Team', color: 'bg-purple-100 text-purple-800' },
  enterprise: { name: 'Enterprise', color: 'bg-yellow-100 text-yellow-800' }
}

export function SubscriptionSection({ profile }: SubscriptionSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Current Plan</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={subscriptionTiers[profile.subscriptionTier as keyof typeof subscriptionTiers]?.color}>
                {subscriptionTiers[profile.subscriptionTier as keyof typeof subscriptionTiers]?.name}
              </Badge>
              <span className="text-sm text-gray-500">
                Status: {profile.subscriptionStatus}
              </span>
            </div>
          </div>
          <Button variant="outline">
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
        </div>
        <Separator />
        <div className="text-sm text-gray-600">
          <p>Member since: {new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  )
}