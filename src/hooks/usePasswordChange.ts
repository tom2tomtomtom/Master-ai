'use client'

import { useState } from 'react'

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function usePasswordChange() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setError('')
    setSuccess('')
  }

  const validatePasswords = (): boolean => {
    setError('')

    if (!passwordForm.currentPassword) {
      setError('Current password is required')
      return false
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return false
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return false
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError('New password must be different from current password')
      return false
    }

    return true
  }

  const changePassword = async (): Promise<boolean> => {
    if (!validatePasswords()) {
      return false
    }

    setIsChangingPassword(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Password changed successfully')
        resetPasswordForm()
        return true
      } else {
        setError(data.error || 'Failed to change password')
        return false
      }
    } catch (error) {
      console.error('Password change error:', error)
      setError('Failed to change password')
      return false
    } finally {
      setIsChangingPassword(false)
    }
  }

  return {
    passwordForm,
    setPasswordForm,
    isChangingPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    error,
    success,
    setError,
    setSuccess,
    changePassword,
    resetPasswordForm,
    validatePasswords
  }
}