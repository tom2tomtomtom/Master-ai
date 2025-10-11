'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { appLogger } from '@/lib/logger'

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  subscriptionTier: string
  subscriptionStatus: string
  createdAt: string
  lastLoginAt: string | null
}

interface ProfileFormData {
  name: string
  email: string
}

export function useProfileData() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: '',
    email: ''
  })

  // Fetch profile data
  const fetchProfile = async () => {
    if (!user) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/profile')
      
      if (response.ok) {
        const userData = await response.json()
        setProfile(userData)
        setProfileForm({
          name: userData.name || '',
          email: userData.email || ''
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load profile')
      }
    } catch (error) {
      appLogger.error('Profile fetch error', { error, component: 'useProfileData' })
      setError('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  // Update profile data
  const updateProfile = async (updates: Partial<ProfileFormData>) => {
    if (!user) return false

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, ...data.user } : null)
        setSuccess('Profile updated successfully')
        return true
      } else {
        setError(data.error || 'Failed to update profile')
        return false
      }
    } catch (error) {
      appLogger.error('Profile update error', { error, component: 'useProfileData' })
      setError('Failed to update profile')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Load profile on mount
  useEffect(() => {
    if (user && !authLoading) {
      fetchProfile()
    }
  }, [user, authLoading])

  return {
    profile,
    profileForm,
    setProfileForm,
    isLoading,
    error,
    success,
    setError,
    setSuccess,
    updateProfile,
    refreshProfile: fetchProfile
  }
}