'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import { validatePasswordStrength } from '@/lib/validation';
import { monitoring } from '@/lib/monitoring';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(validatePasswordStrength(''));

  // Verify token on component mount
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setIsVerifying(false);
      return;
    }

    verifyToken();
  }, [token]);

  // Update password strength as user types
  useEffect(() => {
    setPasswordStrength(validatePasswordStrength(password));
  }, [password]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/auth/verify-reset-token/${token}`);
      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(data.error || 'Invalid reset token');
      }

      setUserEmail(data.user.email);
      setIsVerifying(false);
    } catch (error: any) {
      monitoring.logError('reset_token_verification_error', error, { token });
      setError(error.message || 'Invalid or expired reset link. Please request a new password reset.');
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password.trim()) {
      setError('Please enter a new password.');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!passwordStrength.isStrong) {
      setError('Please choose a stronger password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setIsSuccess(true);
    } catch (error: any) {
      monitoring.logError('password_reset_submit_error', error, {
        token,
        userEmail,
      });
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
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
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Password reset successful</CardTitle>
              <CardDescription>
                Your password has been updated successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  <strong>All set!</strong> You can now sign in with your new password.
                </p>
              </div>

              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  Continue to sign in
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading/verification state
  if (isVerifying) {
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
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
                <p className="text-gray-600">Verifying your reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state (invalid token)
  if (error && !userEmail) {
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
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle>Invalid reset link</CardTitle>
              <CardDescription>
                This reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  <strong>Link expired:</strong> Reset links expire after 1 hour for security reasons.
                </p>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/auth/forgot-password">
                    Request new reset link
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
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

  // Password strength indicator
  const getStrengthColor = () => {
    if (passwordStrength.score <= 1) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-yellow-500';
    if (passwordStrength.score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Main reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-2xl text-gray-900">Master-AI</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset your password</h1>
          <p className="text-gray-600">
            Enter your new password for <span className="font-medium">{userEmail}</span>
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Create new password</CardTitle>
            <CardDescription>
              Choose a strong password to secure your account
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
              {/* New Password */}
              <div>
                <Label htmlFor="password">New password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-600' : 
                        passwordStrength.score <= 4 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${passwordStrength.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !passwordStrength.isStrong}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Resetting password...
                  </div>
                ) : (
                  'Reset password'
                )}
              </Button>
            </form>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Password requirements:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className={`flex items-center gap-2 ${passwordStrength.checks.length ? 'text-green-600' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${passwordStrength.checks.length ? 'bg-green-500' : 'bg-gray-300'}`} />
                  At least 8 characters
                </li>
                <li className={`flex items-center gap-2 ${passwordStrength.checks.uppercase ? 'text-green-600' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${passwordStrength.checks.uppercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                  One uppercase letter
                </li>
                <li className={`flex items-center gap-2 ${passwordStrength.checks.lowercase ? 'text-green-600' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${passwordStrength.checks.lowercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                  One lowercase letter
                </li>
                <li className={`flex items-center gap-2 ${passwordStrength.checks.number ? 'text-green-600' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${passwordStrength.checks.number ? 'bg-green-500' : 'bg-gray-300'}`} />
                  One number
                </li>
                <li className={`flex items-center gap-2 ${passwordStrength.checks.special ? 'text-green-600' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${passwordStrength.checks.special ? 'bg-green-500' : 'bg-gray-300'}`} />
                  One special character
                </li>
              </ul>
            </div>

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
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
                  <p className="text-gray-600">Loading reset form...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}