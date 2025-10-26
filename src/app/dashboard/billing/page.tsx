import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/layout'
import { BillingDashboard } from '@/components/subscription/billing-dashboard'

export const metadata: Metadata = {
  title: 'Billing & Subscription - Master-AI',
  description: 'Manage your subscription and billing information',
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/dashboard/billing')
  }

  return (
    <DashboardLayout title="Billing & Subscription">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600">
            Manage your subscription, billing information, and view invoice history
          </p>
        </div>

        <BillingDashboard />
      </div>
    </DashboardLayout>
  )
}