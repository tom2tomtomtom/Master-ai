'use client'

import { useAuth } from '@/components/providers/safe-auth-provider'
import { useRouter } from 'next/navigation'
import { useProfileData } from '@/hooks/useProfileData'
import { ProfileHeader } from '@/components/profile/profile-header'
import { PersonalInfoSection } from '@/components/profile/personal-info-section'
import { PasswordChangeSection } from '@/components/profile/password-change-section'
import { SubscriptionSection } from '@/components/profile/subscription-section'
import { DangerZoneSection } from '@/components/profile/danger-zone-section'


export default function ProfilePage(): JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const {
    profile,
    profileForm,
    setProfileForm,
    isLoading,
    error,
    success,
    setError,
    setSuccess,
    updateProfile
  } = useProfileData()


  const handleProfileSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setSuccess('')
    await updateProfile(profileForm)
  }


  const handleDeleteAccount = async (deleteForm: { confirmEmail: string; confirmText: string }) => {
    setError('')
    
    try {
      const response = await fetch('/api/user/profile/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteForm),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/')
      } else {
        if (data.details) {
          setError(data.details[0].message)
        } else {
          setError(data.error || 'Failed to delete account')
        }
      }
    } catch (error) {
      setError('Failed to delete account')
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-600">Failed to load profile. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <ProfileHeader error={error} success={success} />
        
        <PersonalInfoSection
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          onSubmit={handleProfileSubmit}
          isSaving={isLoading}
        />
        
        <SubscriptionSection profile={profile} />
        
        <PasswordChangeSection profile={{ ...profile, accounts: [] }} />
        
        <DangerZoneSection
          profile={profile}
          onDeleteAccount={handleDeleteAccount}
          isDeletingAccount={false}
        />
      </div>
    </div>
  )
}