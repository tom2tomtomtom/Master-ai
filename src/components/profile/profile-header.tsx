'use client'

import { AlertCircle, CheckCircle } from 'lucide-react'

interface ProfileHeaderProps {
  error?: string
  success?: string
}

export function ProfileHeader({ error, success }: ProfileHeaderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          {success}
        </div>
      )}
    </div>
  )
}