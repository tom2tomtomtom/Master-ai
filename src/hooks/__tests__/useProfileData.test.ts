/**
 * Unit Tests for useProfileData Hook
 * Tests the custom hook that manages user profile data fetching and updating
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useProfileData } from '../useProfileData'
import { mockFetchResponse, mockFetchError, cleanupMocks, mockAuthContext } from '../../__tests__/utils/test-utils'

// Mock the auth provider
jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: jest.fn(),
}))

const { useAuth } = require('@/components/providers/auth-provider')

describe('useProfileData Hook', () => {
  beforeEach(() => {
    cleanupMocks()
    // Reset the mock implementation before each test
    useAuth.mockReturnValue(mockAuthContext)
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useProfileData())

      expect(result.current.profile).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('')
      expect(result.current.success).toBe('')
      expect(result.current.profileForm).toEqual({
        name: '',
        email: '',
      })
    })

    it('should not fetch profile when user is not authenticated', () => {
      useAuth.mockReturnValue({ ...mockAuthContext, user: null })
      renderHook(() => useProfileData())

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should not fetch profile when auth is loading', () => {
      useAuth.mockReturnValue({ ...mockAuthContext, loading: true })
      renderHook(() => useProfileData())

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('Profile Fetching', () => {
    it('should fetch profile data on mount when user is authenticated', async () => {
      const mockProfileData = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        subscriptionTier: 'PRO',
        subscriptionStatus: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastLoginAt: '2024-01-01T10:00:00.000Z',
      }

      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(mockProfileData))

      const { result } = renderHook(() => useProfileData())

      // Wait for the effect to run and fetch to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/profile')
      })

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfileData)
        expect(result.current.profileForm).toEqual({
          name: 'John Doe',
          email: 'john@example.com',
        })
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBe('')
      })
    })

    it('should handle profile fetch error gracefully', async () => {
      const errorMessage = 'Failed to load profile'
      global.fetch = jest.fn().mockResolvedValue(mockFetchError(errorMessage))

      const { result } = renderHook(() => useProfileData())

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage)
        expect(result.current.profile).toBeNull()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle network error during fetch', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useProfileData())

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load profile')
        expect(result.current.profile).toBeNull()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle empty response data', async () => {
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(null))

      const { result } = renderHook(() => useProfileData())

      await waitFor(() => {
        expect(result.current.profile).toBeNull()
        expect(result.current.profileForm).toEqual({
          name: '',
          email: '',
        })
      })
    })
  })

  describe('Profile Updates', () => {
    it('should update profile successfully', async () => {
      // First, set up initial profile data
      const initialProfile = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        subscriptionTier: 'PRO',
        subscriptionStatus: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastLoginAt: '2024-01-01T10:00:00.000Z',
      }

      const updatedProfile = {
        ...initialProfile,
        name: 'Jane Doe',
        email: 'jane@example.com',
      }

      global.fetch = jest.fn()
        .mockResolvedValueOnce(mockFetchResponse(initialProfile)) // Initial fetch
        .mockResolvedValueOnce(mockFetchResponse({ user: updatedProfile })) // Update response

      const { result } = renderHook(() => useProfileData())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.profile).toEqual(initialProfile)
      })

      // Test update
      let updateResult: boolean

      await act(async () => {
        updateResult = await result.current.updateProfile({
          name: 'Jane Doe',
          email: 'jane@example.com',
        })
      })

      expect(updateResult!).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
        }),
      })

      await waitFor(() => {
        expect(result.current.profile).toEqual(updatedProfile)
        expect(result.current.success).toBe('Profile updated successfully')
        expect(result.current.error).toBe('')
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle update error gracefully', async () => {
      const errorMessage = 'Failed to update profile'
      global.fetch = jest.fn()
        .mockResolvedValueOnce(mockFetchResponse({})) // Initial fetch
        .mockResolvedValueOnce(mockFetchError(errorMessage)) // Update error

      const { result } = renderHook(() => useProfileData())

      let updateResult: boolean

      await act(async () => {
        updateResult = await result.current.updateProfile({
          name: 'Updated Name',
        })
      })

      expect(updateResult!).toBe(false)

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage)
        expect(result.current.success).toBe('')
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should not update profile when user is not authenticated', async () => {
      useAuth.mockReturnValue({ ...mockAuthContext, user: null })

      const { result } = renderHook(() => useProfileData())

      let updateResult: boolean

      await act(async () => {
        updateResult = await result.current.updateProfile({
          name: 'Updated Name',
        })
      })

      expect(updateResult!).toBe(false)
      expect(global.fetch).not.toHaveBeenCalledWith('/api/user/profile', expect.objectContaining({
        method: 'PATCH',
      }))
    })

    it('should handle network error during update', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(mockFetchResponse({})) // Initial fetch
        .mockRejectedValueOnce(new Error('Network error')) // Update network error

      const { result } = renderHook(() => useProfileData())

      let updateResult: boolean

      await act(async () => {
        updateResult = await result.current.updateProfile({
          name: 'Updated Name',
        })
      })

      expect(updateResult!).toBe(false)

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to update profile')
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Profile Refresh', () => {
    it('should refresh profile data when refreshProfile is called', async () => {
      const profileData = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        subscriptionTier: 'PRO',
        subscriptionStatus: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastLoginAt: '2024-01-01T10:00:00.000Z',
      }

      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(profileData))

      const { result } = renderHook(() => useProfileData())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.profile).toEqual(profileData)
      })

      // Clear the mock to count only refresh calls
      jest.clearAllMocks()
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(profileData))

      // Call refresh
      await act(async () => {
        await result.current.refreshProfile()
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith('/api/user/profile')
    })
  })

  describe('Form State Management', () => {
    it('should allow updating profile form state', () => {
      const { result } = renderHook(() => useProfileData())

      act(() => {
        result.current.setProfileForm({
          name: 'New Name',
          email: 'new@example.com',
        })
      })

      expect(result.current.profileForm).toEqual({
        name: 'New Name',
        email: 'new@example.com',
      })
    })

    it('should allow clearing error and success messages', () => {
      global.fetch = jest.fn().mockResolvedValue(mockFetchError('Test error'))

      const { result } = renderHook(() => useProfileData())

      // Wait for error to be set
      waitFor(() => {
        expect(result.current.error).toBe('Test error')
      })

      act(() => {
        result.current.setError('')
        result.current.setSuccess('Test success')
      })

      expect(result.current.error).toBe('')
      expect(result.current.success).toBe('Test success')
    })
  })

  describe('Loading States', () => {
    it('should manage loading state during profile fetch', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      global.fetch = jest.fn().mockReturnValue(promise)

      const { result } = renderHook(() => useProfileData())

      // Should be loading initially
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve the promise
      resolvePromise(mockFetchResponse({}))

      // Should not be loading after resolution
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should manage loading state during profile update', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(mockFetchResponse({})) // Initial fetch

      const { result } = renderHook(() => useProfileData())

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let resolveUpdatePromise: (value: any) => void
      const updatePromise = new Promise((resolve) => {
        resolveUpdatePromise = resolve
      })

      global.fetch = jest.fn().mockReturnValue(updatePromise)

      // Start update
      const updatePromiseResult = act(async () => {
        return result.current.updateProfile({ name: 'New Name' })
      })

      // Should be loading during update
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve the update
      resolveUpdatePromise!(mockFetchResponse({ user: {} }))
      await updatePromiseResult

      // Should not be loading after update
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})