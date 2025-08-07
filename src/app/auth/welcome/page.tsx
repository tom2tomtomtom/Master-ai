'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  BookOpen,
  Trophy,
  Users,
  Target,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

const learningPaths = [
  {
    id: 'foundations',
    title: 'AI Foundations',
    description: 'Master the core concepts and terminology of artificial intelligence',
    icon: Brain,
    color: 'bg-blue-500',
    lessons: 12,
    difficulty: 'Beginner',
    estimatedHours: 8
  },
  {
    id: 'chatgpt-mastery',
    title: 'ChatGPT Mastery',
    description: 'Become an expert in prompt engineering and ChatGPT capabilities',
    icon: Sparkles,
    color: 'bg-green-500',
    lessons: 15,
    difficulty: 'Intermediate',
    estimatedHours: 12
  },
  {
    id: 'business-ai',
    title: 'Business AI Applications',
    description: 'Apply AI tools to real-world business scenarios and workflows',
    icon: Target,
    color: 'bg-purple-500',
    lessons: 18,
    difficulty: 'Advanced',
    estimatedHours: 15
  },
  {
    id: 'ai-productivity',
    title: 'AI Productivity Suite',
    description: 'Maximize your productivity with AI-powered tools and automation',
    icon: Trophy,
    color: 'bg-orange-500',
    lessons: 14,
    difficulty: 'Intermediate',
    estimatedHours: 10
  }
];

const features = [
  {
    icon: BookOpen,
    title: 'Interactive Lessons',
    description: 'Hands-on lessons with real examples and practical exercises'
  },
  {
    icon: Trophy,
    title: 'Certificates',
    description: 'Earn professional certificates to showcase your AI expertise'
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with fellow learners and AI professionals'
  }
];

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleGetStarted = () => {
    if (selectedPath) {
      router.push(`/dashboard/path/${selectedPath}`);
    } else {
      router.push('/dashboard');
    }
  };

  const subscriptionTier = session.user.subscriptionTier || 'free';
  const isFreeTier = subscriptionTier === 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 mb-6">
              <Brain className="h-12 w-12 text-blue-600" />
              <span className="font-bold text-3xl text-gray-900">Master-AI</span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Master-AI, {session.user.name?.split(' ')[0] || 'there'}! 🎉
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              You're about to embark on an incredible AI learning journey. Let's get you started!
            </p>

            {/* Subscription Badge */}
            <div className="flex justify-center mb-8">
              <Badge 
                className={cn(
                  "text-lg px-4 py-2",
                  subscriptionTier === 'free' ? 'bg-gray-100 text-gray-800' :
                  subscriptionTier === 'pro' ? 'bg-blue-100 text-blue-800' :
                  subscriptionTier === 'team' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                )}
              >
                🎯 {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan Active
              </Badge>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium",
                currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              )}>
                1
              </div>
              <div className={cn(
                "w-16 h-1 rounded",
                currentStep > 1 ? "bg-blue-600" : "bg-gray-200"
              )} />
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium",
                currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              )}>
                2
              </div>
            </div>
          </div>

          {currentStep === 1 ? (
            /* Step 1: Choose Learning Path */
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Choose Your Learning Path
                </h2>
                <p className="text-gray-600 mb-8">
                  Select a learning path that matches your goals and experience level
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {learningPaths.map((path) => {
                  const Icon = path.icon;
                  const isSelected = selectedPath === path.id;
                  const isLocked = isFreeTier && path.difficulty !== 'Beginner';
                  
                  return (
                    <Card
                      key={path.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        isSelected 
                          ? "ring-2 ring-blue-500 border-blue-500 shadow-lg" 
                          : "hover:shadow-md hover:border-gray-300",
                        isLocked && "opacity-60 cursor-not-allowed"
                      )}
                      onClick={() => !isLocked && setSelectedPath(path.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg text-white", path.color)}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{path.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {path.difficulty}
                                </Badge>
                                {isLocked && (
                                  <Badge className="text-xs bg-orange-100 text-orange-800">
                                    Pro Only
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {isSelected && !isLocked && (
                            <CheckCircle className="h-6 w-6 text-blue-500" />
                          )}
                        </div>
                        <CardDescription className="mt-2">
                          {path.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{path.lessons} lessons</span>
                          <span>~{path.estimatedHours} hours</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {isFreeTier && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <p className="text-blue-800 mb-4">
                    <strong>Want access to all learning paths?</strong> Upgrade to Pro for unlimited access to all 81 lessons and advanced features.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/pricing">
                      Upgrade to Pro
                    </Link>
                  </Button>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedPath}
                  size="lg"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            /* Step 2: Platform Overview */
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  You're All Set! 🚀
                </h2>
                <p className="text-gray-600 mb-8">
                  Here's what you can expect from your Master-AI experience
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={index} className="text-center">
                      <CardContent className="pt-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Quick Tips */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Quick Tips for Success
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Take notes during lessons - you can save them for later reference</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Practice with the interactive exercises to reinforce your learning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Track your progress and celebrate your achievements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Join our community to connect with other AI enthusiasts</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="text-lg px-8 py-3"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Learning
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-3"
                  asChild
                >
                  <Link href="/dashboard">
                    Explore Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help getting started?{' '}
              <Link href="/help" className="text-blue-600 hover:text-blue-500">
                Visit our Help Center
              </Link>
              {' '}or{' '}
              <Link href="/contact" className="text-blue-600 hover:text-blue-500">
                contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}