'use client'

import { useState, useEffect } from 'react'
import { appLogger } from '@/lib/logger';
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SubscriptionWidget } from './subscription-widget'
import { PricingSection } from './pricing-section'
import { 
  CreditCard, 
  Download, 
  Calendar, 
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'

interface Invoice {
  id: string
  stripeInvoiceId: string
  status: string
  amountDue: number
  amountPaid: number
  currency: string
  description: string | null
  invoiceUrl: string | null
  hostedInvoiceUrl: string | null
  periodStart: string | null
  periodEnd: string | null
  paidAt: string | null
  dueDate: string | null
  createdAt: string
}

interface SubscriptionData {
  tier: string
  status: string
  canUpgrade: boolean
  hasActiveSubscription: boolean
}

export function BillingDashboard() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [invoicesLoading, setInvoicesLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch subscription data
      const subscriptionResponse = await fetch('/api/subscriptions/current')
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json()
        setSubscriptionData(subscriptionData)
      }

      // Fetch invoices
      setInvoicesLoading(true)
      const invoicesResponse = await fetch('/api/stripe/invoices')
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setInvoices(invoicesData.invoices || [])
      }
    } catch (error) {
      appLogger.error('Error fetching billing data:', { error: error, component: 'billing-dashboard' })
      toast.error('Failed to load billing data')
    } finally {
      setLoading(false)
      setInvoicesLoading(false)
    }
  }

  const handleDownloadInvoice = async (invoice: Invoice) => {
    if (invoice.invoiceUrl) {
      window.open(invoice.invoiceUrl, '_blank')
    } else if (invoice.hostedInvoiceUrl) {
      window.open(invoice.hostedInvoiceUrl, '_blank')
    } else {
      toast.error('Invoice not available for download')
    }
  }

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'void':
      case 'uncollectible':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'open':
        return 'bg-yellow-100 text-yellow-700'
      case 'void':
      case 'uncollectible':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Current Subscription</h2>
        <SubscriptionWidget />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Billing Summary */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(invoices.reduce((total, invoice) => total + invoice.amountPaid, 0))}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold">{invoices.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-2xl font-bold">
                    {invoices.length > 0 
                      ? formatDistanceToNow(new Date(invoices[invoices.length - 1].createdAt), { addSuffix: false })
                      : 'New'
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Invoices</h3>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </div>

            {invoicesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No invoices found</p>
                <p className="text-sm">Invoices will appear here after your first payment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(invoices || []).slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(invoice.status)}
                      <div>
                        <p className="font-medium">
                          {invoice.description || `Invoice ${(invoice.stripeInvoiceId || '').slice(-8)}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.periodStart && invoice.periodEnd 
                            ? `${new Date(invoice.periodStart).toLocaleDateString()} - ${new Date(invoice.periodEnd).toLocaleDateString()}`
                            : new Date(invoice.createdAt).toLocaleDateString()
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      <span className="font-semibold">
                        {formatAmount(invoice.amountPaid, invoice.currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice)}
                        disabled={!invoice.invoiceUrl && !invoice.hostedInvoiceUrl}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">All Invoices</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Refresh
                </Button>
              </div>
            </div>

            {invoicesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium mb-2">No invoices yet</h4>
                <p>Your invoices will appear here after your first payment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Invoice</th>
                      <th className="text-left py-3 px-2">Period</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Amount</th>
                      <th className="text-left py-3 px-2">Date</th>
                      <th className="text-right py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(invoice.status)}
                            <span className="font-medium">
                              #{(invoice.stripeInvoiceId || '').slice(-8)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {invoice.periodStart && invoice.periodEnd 
                            ? `${new Date(invoice.periodStart).toLocaleDateString()} - ${new Date(invoice.periodEnd).toLocaleDateString()}`
                            : '-'
                          }
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 font-semibold">
                          {formatAmount(invoice.amountPaid, invoice.currency)}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {invoice.paidAt 
                            ? new Date(invoice.paidAt).toLocaleDateString()
                            : new Date(invoice.createdAt).toLocaleDateString()
                          }
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {invoice.hostedInvoiceUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(invoice.hostedInvoiceUrl!, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(invoice)}
                              disabled={!invoice.invoiceUrl && !invoice.hostedInvoiceUrl}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="upgrade">
          <PricingSection 
            currentSubscription={subscriptionData as any} 
            showTitle={false}
            embedded={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}