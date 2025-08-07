'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AcademicCapIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  ShareIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface CertificateCardProps {
  certificate: {
    id: string;
    name: string;
    description?: string;
    type: string;
    category: string;
    badgeImageUrl?: string;
    isEarned: boolean;
    earnedAt?: Date;
    expiresAt?: Date | null;
    verificationCode?: string;
    certificateUrl?: string;
    eligibility?: {
      isEligible: boolean;
      missingRequirements: string[];
      progress: Record<string, any>;
      nextActions: string[];
    };
  };
  onGenerateCertificate?: (certificateId: string) => void;
  onViewCertificate?: (certificateUrl: string) => void;
  onShareCertificate?: (certificate: any) => void;
}

export default function CertificateCard({
  certificate,
  onGenerateCertificate,
  onViewCertificate,
  onShareCertificate,
}: CertificateCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning_path':
        return <AcademicCapIcon className="h-5 w-5" />;
      case 'skill':
        return <StarIcon className="h-5 w-5" />;
      case 'professional':
        return <DocumentTextIcon className="h-5 w-5" />;
      default:
        return <AcademicCapIcon className="h-5 w-5" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateOverallProgress = () => {
    if (!certificate.eligibility?.progress) return 0;
    
    const progress = certificate.eligibility.progress;
    let totalProgress = 0;
    let totalWeight = 0;

    // Calculate progress for lessons
    if (progress.lessons) {
      const lessonProgress = (progress.lessons.completed / progress.lessons.required) * 100;
      totalProgress += lessonProgress * 0.6; // 60% weight for lessons
      totalWeight += 0.6;
    }

    // Calculate progress for paths
    if (progress.paths) {
      const pathProgress = (progress.paths.completed / progress.paths.required) * 100;
      totalProgress += pathProgress * 0.4; // 40% weight for paths
      totalWeight += 0.4;
    }

    return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;
  };

  const handleGenerateCertificate = async () => {
    if (!onGenerateCertificate) return;
    
    setIsGenerating(true);
    try {
      await onGenerateCertificate(certificate.id);
    } finally {
      setIsGenerating(false);
    }
  };

  const isExpired = certificate.expiresAt && new Date() > certificate.expiresAt;

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
      certificate.isEarned ? 'border-green-200 bg-green-50/30' : 'hover:border-blue-200'
    }`}>
      {/* Earned Indicator */}
      {certificate.isEarned && (
        <div className="absolute top-4 right-4">
          <CheckCircleIconSolid className="h-6 w-6 text-green-500" />
        </div>
      )}

      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {certificate.badgeImageUrl ? (

              <img
                src={certificate.badgeImageUrl}
                alt={certificate.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                {getCategoryIcon(certificate.category)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {certificate.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getCertificationTypeColor(certificate.type)}>
                  {certificate.type.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {certificate.category.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {certificate.description && (
          <CardDescription className="line-clamp-2">
            {certificate.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Earned Certificate Info */}
        {certificate.isEarned && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircleIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Certificate Earned</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Earned</p>
                  <p className="font-medium">
                    {certificate.earnedAt && formatDate(certificate.earnedAt)}
                  </p>
                </div>
              </div>

              {certificate.expiresAt && (
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">
                      {isExpired ? 'Expired' : 'Valid Until'}
                    </p>
                    <p className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                      {formatDate(certificate.expiresAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {certificate.verificationCode && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Verification Code</p>
                <p className="font-mono text-sm font-medium text-blue-600">
                  {certificate.verificationCode}
                </p>
              </div>
            )}

            {/* Certificate Actions */}
            <div className="flex space-x-2">
              {certificate.certificateUrl ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onViewCertificate?.(certificate.certificateUrl!)}
                  className="flex-1"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGenerateCertificate}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate PDF'}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onShareCertificate?.(certificate)}
              >
                <ShareIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Progress for Non-Earned Certificates */}
        {!certificate.isEarned && certificate.eligibility && (
          <div className="space-y-3">
            {certificate.eligibility.isEligible ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-700 mb-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Ready to Earn!</span>
                </div>
                <p className="text-green-600 text-sm">
                  You've met all requirements for this certification.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={handleGenerateCertificate}
                >
                  Claim Certificate
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-500">
                    {calculateOverallProgress()}% Complete
                  </span>
                </div>
                
                <Progress value={calculateOverallProgress()} className="h-2" />

                {/* Requirements */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Requirements
                  </p>
                  <div className="space-y-1">
                    {certificate.eligibility.missingRequirements.slice(0, 3).map((req, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        <span className="text-sm text-gray-600">{req}</span>
                      </div>
                    ))}
                    {certificate.eligibility.missingRequirements.length > 3 && (
                      <p className="text-xs text-gray-500 pl-3">
                        +{certificate.eligibility.missingRequirements.length - 3} more
                      </p>
                    )}
                  </div>
                </div>

                {/* Next Actions */}
                {certificate.eligibility.nextActions.length > 0 && (
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-1">Next Step</p>
                    <p className="text-sm text-blue-600">
                      {certificate.eligibility.nextActions[0]}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}