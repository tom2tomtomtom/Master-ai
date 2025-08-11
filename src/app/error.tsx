'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCcw, Home, Bug } from 'lucide-react'
import Link from 'next/link'
import { appLogger } from '@/lib/logger'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps): JSX.Element {
  const errorId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    // Log the error with structured logging
    appLogger.errors.nextjsError(error, {
      errorId,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      stack: error.stack,
    })
  }, [error, errorId])

  const handleReportBug = (): void => {
    if (typeof window !== 'undefined') {
      const subject = encodeURIComponent(`App Error: ${error.message.slice(0, 50)}...`)
      const body = encodeURIComponent(
        `Error ID: ${errorId}\n\n` +
        `Error Message: ${error.message}\n\n` +
        `Digest: ${error.digest || 'N/A'}\n\n` +
        `URL: ${window.location.href}\n\n` +
        `User Agent: ${window.navigator.userAgent}\n\n` +
        `Please describe what you were doing when this error occurred:\n\n`
      )
      
      window.open(`mailto:support@master-ai-learn.com?subject=${subject}&body=${body}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Application Error
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              An unexpected error occurred in the application. This has been automatically reported to our team.
            </p>
            <div className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
              Error ID: {errorId}
              {error.digest && (
                <>
                  <br />
                  Digest: {error.digest}
                </>
              )}
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium mb-1">
                Development Details:
              </p>
              <p className="text-xs text-red-700 font-mono break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap overflow-x-auto">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
            
            <Button variant="ghost" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleReportBug} 
              className="w-full text-gray-600"
            >
              <Bug className="w-4 h-4 mr-2" />
              Report Bug
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center mt-4">
            <p>
              If this problem persists, please contact support at{' '}
              <a 
                href="mailto:support@master-ai-learn.com" 
                className="text-blue-600 hover:underline"
              >
                support@master-ai-learn.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}