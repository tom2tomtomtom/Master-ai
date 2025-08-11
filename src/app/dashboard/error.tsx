'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCcw, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { appLogger } from '@/lib/logger'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps): JSX.Element {
  const errorId = `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    // Log dashboard-specific error
    appLogger.errors.dashboardError(error, {
      errorId,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      section: 'dashboard',
    })
  }, [error, errorId])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-lg text-gray-900">
            Dashboard Error
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Something went wrong loading your dashboard. Don't worry, your progress is safe.
            </p>
            <div className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
              Error ID: {errorId}
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800 font-medium mb-1">
                Development Details:
              </p>
              <p className="text-xs text-orange-700 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard Home
              </Link>
            </Button>
            
            <Button variant="ghost" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>
              Your learning progress and data are safe. This is just a temporary display issue.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}