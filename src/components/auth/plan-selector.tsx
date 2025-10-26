'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanSelectorProps {
  selectedPlan: string;
  onPlanSelect: (plan: string) => void;
  className?: string;
}

const plans = [
  {
    id: 'free',
    name: 'Free Explorer',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Lesson 00 Tool Guide',
      '3 foundation lessons',
      'Community access',
      'Basic progress tracking'
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'Most popular for professionals',
    features: [
      'All 81 lessons',
      'Interactive exercises',
      'Professional certificates',
      'Advanced analytics',
      'Email support'
    ],
    popular: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$99',
    period: '/user/month',
    description: 'Perfect for growing teams',
    features: [
      'Everything in Pro',
      'Team dashboard',
      'Progress analytics',
      'Custom learning paths',
      'Priority support'
    ],
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'Tailored for large organizations',
    features: [
      'Custom training',
      'Dedicated success manager',
      'API integrations',
      'Advanced security',
      'On-site training'
    ],
    popular: false,
  }
];

export function PlanSelector({ selectedPlan, onPlanSelect, className }: PlanSelectorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose your plan</h3>
        <p className="text-sm text-gray-600">You can change your plan anytime after signup</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md relative",
              selectedPlan === plan.id
                ? "ring-2 ring-blue-500 border-blue-500"
                : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => onPlanSelect(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {selectedPlan === plan.id && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-gray-500">{plan.period}</span>
                )}
              </div>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedPlan === 'enterprise' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Enterprise Plan:</strong> Contact our sales team for custom pricing and features tailored to your organization's needs.
          </p>
        </div>
      )}
    </div>
  );
}