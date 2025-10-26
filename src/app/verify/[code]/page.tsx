'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { monitoring } from '@/lib/monitoring';

interface VerificationResult {
  isValid: boolean;
  certification?: {
    name: string;
    description?: string;
    type: string;
    category: string;
  };
  recipient?: {
    name: string;
  };
  issuedAt?: string;
  expiresAt?: string | null;
  isExpired?: boolean;
  issuer?: {
    name: string;
    website: string;
  };
  error?: string;
}

export default function VerifyPage() {
  const params = useParams();
  const verificationCode = params.code as string;
  
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (verificationCode) {
      verifyCode();
    }
  }, [verificationCode]);

  const verifyCode = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/verify/${verificationCode}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to verify certificate');
        return;
      }

      setVerificationResult(data);
    } catch (err) {
      setError('Failed to verify certificate');
      monitoring.logError('certificate_verification_error', err, {
        verificationCode,
        url: window.location.href,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCertificationTypeColor = (type: string) => {
    switch (type) {
      case 'professional':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tool_mastery':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'path':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying certificate...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Certificate Verification
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Verify the authenticity of Master-AI certificates and professional credentials
          </p>
        </div>

        {/* Verification Code Display */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Verification Code</CardTitle>
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg">
              <code className="text-lg font-mono text-blue-600">
                {verificationCode}
              </code>
            </div>
          </CardHeader>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <XCircleIcon className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    Verification Failed
                  </h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={verifyCode} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invalid Certificate */}
        {verificationResult && !verificationResult.isValid && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <XCircleIcon className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    Invalid Certificate
                  </h3>
                  <p className="text-red-700">
                    This certificate could not be verified. It may be invalid, revoked, or expired.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Valid Certificate */}
        {verificationResult && verificationResult.isValid && (
          <div className="space-y-6">
            {/* Verification Status */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  {verificationResult.isExpired ? (
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                  ) : (
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      {verificationResult.isExpired ? 'Certificate Expired' : 'Certificate Valid'}
                    </h3>
                    <p className="text-green-700">
                      {verificationResult.isExpired
                        ? 'This certificate was valid but has now expired.'
                        : 'This certificate is authentic and verified by Master-AI.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                  <CardTitle>Certificate Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Certification Name */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {verificationResult.certification?.name}
                  </h4>
                  {verificationResult.certification?.description && (
                    <p className="text-gray-600 mt-1">
                      {verificationResult.certification.description}
                    </p>
                  )}
                </div>

                {/* Certificate Type and Category */}
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={getCertificationTypeColor(verificationResult.certification?.type || '')}
                  >
                    {verificationResult.certification?.type?.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="secondary">
                    {verificationResult.certification?.category?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <Separator />

                {/* Recipient */}
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Awarded to</p>
                    <p className="font-semibold">
                      {verificationResult.recipient?.name || 'Anonymous'}
                    </p>
                  </div>
                </div>

                {/* Issue Date */}
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Issued on</p>
                    <p className="font-semibold">
                      {verificationResult.issuedAt && formatDate(verificationResult.issuedAt)}
                    </p>
                  </div>
                </div>

                {/* Expiration Date */}
                {verificationResult.expiresAt && (
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">
                        {verificationResult.isExpired ? 'Expired on' : 'Valid until'}
                      </p>
                      <p className={`font-semibold ${verificationResult.isExpired ? 'text-red-600' : ''}`}>
                        {formatDate(verificationResult.expiresAt)}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Issuer Information */}
                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Issued by</p>
                    <p className="font-semibold">{verificationResult.issuer?.name}</p>
                    <a 
                      href={verificationResult.issuer?.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {verificationResult.issuer?.website}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Notice */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <DocumentCheckIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      About Certificate Verification
                    </h4>
                    <div className="text-blue-800 text-sm space-y-2">
                      <p>
                        This certificate has been digitally verified using cryptographic 
                        signatures and cannot be forged or tampered with.
                      </p>
                      <p>
                        For questions about this certificate or to report suspicious 
                        activity, please contact Master-AI support.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t">
          <p className="text-gray-500 text-sm">
            Certificate verification powered by Master-AI • 
            <a 
              href="https://master-ai.com" 
              className="text-blue-600 hover:text-blue-800 ml-1"
            >
              Learn More
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}