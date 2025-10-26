'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, AlertCircle, CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import { isValidEmail } from '@/lib/validation';
import { monitoring } from '@/lib/monitoring';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setIsSubmitted(true);
    } catch (error: any) {
      monitoring.logError('password_reset_error', error, {
        email,
      });
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-2xl text-gray-900">Master-AI</span>
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We've sent password reset instructions to {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  variant="outline" 
                  className="w-full"
                >
                  Try another email
                </Button>
                <Button asChild className="w-full">
                  <Link href="/auth/signin">
                    Return to sign in
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-2xl text-gray-900">Master-AI</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot password?</h1>
          <p className="text-gray-600">Enter your email to receive reset instructions</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>
              We'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={isLoading}
                  className="mt-1"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending instructions...
                  </div>
                ) : (
                  'Send reset instructions'
                )}
              </Button>
            </form>

            {/* Back to Sign In */}
            <div className="text-center">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Still having trouble?{' '}
            <Link href="/contact" className="text-blue-600 hover:text-blue-500">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}