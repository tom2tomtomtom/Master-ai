'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { SupabaseAuth } from '@/components/auth/supabase-auth';
import { Brain } from 'lucide-react';

function SignUpContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-2xl text-gray-900">Master-AI</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Learning</h1>
          <p className="text-gray-600">Create your account to access 89 AI lessons</p>
        </div>

        {/* Supabase Auth Component */}
        <SupabaseAuth mode="signup" redirectTo="/dashboard" />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}