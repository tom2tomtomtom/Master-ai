/**
 * Unit Tests for usePasswordChange Hook
 * Tests the custom hook that manages password change functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { usePasswordChange } from '../usePasswordChange'
import { mockFetchResponse, mockFetchError, cleanupMocks } from '../../__tests__/utils/test-utils'

describe('usePasswordChange Hook', () => {
  beforeEach(() => {
    cleanupMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => usePasswordChange())

      expect(result.current.passwordForm).toEqual({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      expect(result.current.isChangingPassword).toBe(false)
      expect(result.current.showCurrentPassword).toBe(false)
      expect(result.current.showNewPassword).toBe(false)
      expect(result.current.showConfirmPassword).toBe(false)
      expect(result.current.error).toBe('')
      expect(result.current.success).toBe('')
    })
  })

  describe('Form State Management', () => {
    it('should update password form state', () => {
      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      expect(result.current.passwordForm).toEqual({
        currentPassword: 'current123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      })
    })

    it('should toggle password visibility states', () => {
      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setShowCurrentPassword(true)
        result.current.setShowNewPassword(true)
        result.current.setShowConfirmPassword(true)
      })

      expect(result.current.showCurrentPassword).toBe(true)
      expect(result.current.showNewPassword).toBe(true)
      expect(result.current.showConfirmPassword).toBe(true)
    })

    it('should reset password form', () => {
      const { result } = renderHook(() => usePasswordChange())

      // First, set some values
      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        result.current.setError('Test error')
        result.current.setSuccess('Test success')
      })

      // Then reset
      act(() => {
        result.current.resetPasswordForm()
      })

      expect(result.current.passwordForm).toEqual({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      expect(result.current.error).toBe('')
      expect(result.current.success).toBe('')
    })

    it('should update error and success messages', () => {
      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setError('Test error')
        result.current.setSuccess('Test success')
      })

      expect(result.current.error).toBe('Test error')
      expect(result.current.success).toBe('Test success')
    })
  })

  describe('Password Validation', () => {
    it('should validate required current password', () => {
      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: '',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      let isValid: boolean
      act(() => {
        isValid = result.current.validatePasswords()
      })

      expect(isValid!).toBe(false)
      expect(result.current.error).toBe('Current password is required')
    })

    it('should validate new password length', () => {
      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'short', // Less than 8 characters
          confirmPassword: 'short',
        })
      })

      let isValid: boolean
      act(() => {
        isValid = result.current.validatePasswords()
      })

      expect(isValid!).toBe(false)
      expect(result.current.error).toBe('New password must be at least 8 characters long')
    })

    it('should validate password confirmation match', () => {
      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'differentpassword123',
        })
      })

      let isValid: boolean
      act(() => {
        isValid = result.current.validatePasswords()
      })

      expect(isValid!).toBe(false)
      expect(result.current.error).toBe('New passwords do not match')
    })

    it('should validate that new password is different from current', () => {
      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'samepassword123',
          newPassword: 'samepassword123',
          confirmPassword: 'samepassword123',
        })
      })

      let isValid: boolean
      act(() => {
        isValid = result.current.validatePasswords()
      })

      expect(isValid!).toBe(false)
      expect(result.current.error).toBe('New password must be different from current password')
    })

    it('should pass validation for valid passwords', () => {
      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      let isValid: boolean
      act(() => {
        isValid = result.current.validatePasswords()
      })

      expect(isValid!).toBe(true)
      expect(result.current.error).toBe('')
    })

    it('should clear previous errors before validation', () => {
      const { result } = renderHook(() => usePasswordChange())

      // Set an error first
      act(() => {
        result.current.setError('Previous error')
      })

      // Then validate with valid data
      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      let isValid: boolean
      act(() => {
        isValid = result.current.validatePasswords()
      })

      expect(isValid!).toBe(true)
      expect(result.current.error).toBe('')
    })
  })

  describe('Password Change', () => {
    it('should change password successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse({ success: true }))

      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      let changeResult: boolean

      await act(async () => {
        changeResult = await result.current.changePassword()
      })

      expect(changeResult!).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
        }),
      })

      await waitFor(() => {
        expect(result.current.success).toBe('Password changed successfully')
        expect(result.current.error).toBe('')
        expect(result.current.isChangingPassword).toBe(false)
        // Form should be reset after successful change
        expect(result.current.passwordForm).toEqual({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      })
    })

    it('should handle password change error from server', async () => {
      const errorMessage = 'Current password is incorrect'
      global.fetch = jest.fn().mockResolvedValue(mockFetchError(errorMessage))

      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'wrong123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      let changeResult: boolean

      await act(async () => {
        changeResult = await result.current.changePassword()
      })

      expect(changeResult!).toBe(false)

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage)
        expect(result.current.success).toBe('')
        expect(result.current.isChangingPassword).toBe(false)
      })
    })

    it('should handle network error during password change', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      let changeResult: boolean

      await act(async () => {
        changeResult = await result.current.changePassword()
      })

      expect(changeResult!).toBe(false)

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to change password')
        expect(result.current.success).toBe('')
        expect(result.current.isChangingPassword).toBe(false)
      })
    })

    it('should not change password if validation fails', async () => {
      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: '',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      let changeResult: boolean

      await act(async () => {
        changeResult = await result.current.changePassword()
      })

      expect(changeResult!).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
      expect(result.current.error).toBe('Current password is required')
    })

    it('should manage loading state during password change', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      global.fetch = jest.fn().mockReturnValue(promise)

      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      // Start the password change
      const changePromise = act(async () => {
        return result.current.changePassword()
      })

      // Should be loading during the request
      await waitFor(() => {
        expect(result.current.isChangingPassword).toBe(true)
      })

      // Resolve the promise
      resolvePromise!(mockFetchResponse({ success: true }))
      await changePromise

      // Should not be loading after completion
      await waitFor(() => {
        expect(result.current.isChangingPassword).toBe(false)
      })
    })

    it('should clear error and success messages before password change', async () => {
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse({ success: true }))

      const { result } = renderHook(() => usePasswordChange())

      // Set initial error and success
      act(() => {
        result.current.setError('Previous error')
        result.current.setSuccess('Previous success')
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      await act(async () => {
        await result.current.changePassword()
      })

      // Should have cleared previous messages and set new success message
      await waitFor(() => {
        expect(result.current.success).toBe('Password changed successfully')
        expect(result.current.error).toBe('')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle server response without error message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}), // No error message in response
      })

      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      let changeResult: boolean

      await act(async () => {
        changeResult = await result.current.changePassword()
      })

      expect(changeResult!).toBe(false)

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to change password')
      })
    })

    it('should handle malformed server response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      const { result } = renderHook(() => usePasswordChange())

      act(() => {
        result.current.setPasswordForm({
          currentPassword: 'current123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })

      let changeResult: boolean

      await act(async () => {
        changeResult = await result.current.changePassword()
      })

      expect(changeResult!).toBe(false)

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to change password')
      })
    })
  })
})