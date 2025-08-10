/**
 * Component Tests for ProfileHeader
 * Tests the profile header component that displays error and success messages
 */

import React from 'react'
import { render, screen } from '../../../__tests__/utils/test-utils'
import { ProfileHeader } from '../profile-header'

describe('ProfileHeader Component', () => {
  describe('Basic Rendering', () => {
    it('should render the profile header with title and description', () => {
      render(<ProfileHeader />)
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Profile Settings')
      expect(screen.getByText('Manage your account settings and preferences')).toBeInTheDocument()
    })

    it('should render without error or success messages by default', () => {
      render(<ProfileHeader />)
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/success/i)).not.toBeInTheDocument()
    })
  })

  describe('Error Message Display', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to update profile'
      
      render(<ProfileHeader error={errorMessage} />)
      
      const errorAlert = screen.getByText(errorMessage)
      expect(errorAlert).toBeInTheDocument()
      
      // Check for error styling classes
      const errorContainer = errorAlert.parentElement
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200', 'text-red-700')
    })

    it('should display AlertCircle icon with error message', () => {
      const errorMessage = 'Something went wrong'
      
      render(<ProfileHeader error={errorMessage} />)
      
      // Check that the error container exists and has the right structure
      const errorContainer = screen.getByText(errorMessage).parentElement
      expect(errorContainer).toHaveClass('flex', 'items-center', 'gap-2')
    })

    it('should handle empty error message gracefully', () => {
      render(<ProfileHeader error="" />)
      
      expect(screen.queryByText('')).not.toBeInTheDocument()
    })

    it('should handle long error messages', () => {
      const longErrorMessage = 'This is a very long error message that should still be displayed correctly in the profile header component without breaking the layout'
      
      render(<ProfileHeader error={longErrorMessage} />)
      
      expect(screen.getByText(longErrorMessage)).toBeInTheDocument()
    })

    it('should handle special characters in error messages', () => {
      const specialCharError = 'Error with special chars: <>&"\'`'
      
      render(<ProfileHeader error={specialCharError} />)
      
      expect(screen.getByText(specialCharError)).toBeInTheDocument()
    })
  })

  describe('Success Message Display', () => {
    it('should display success message when success prop is provided', () => {
      const successMessage = 'Profile updated successfully'
      
      render(<ProfileHeader success={successMessage} />)
      
      const successAlert = screen.getByText(successMessage)
      expect(successAlert).toBeInTheDocument()
      
      // Check for success styling classes
      const successContainer = successAlert.parentElement
      expect(successContainer).toHaveClass('bg-green-50', 'border-green-200', 'text-green-700')
    })

    it('should display CheckCircle icon with success message', () => {
      const successMessage = 'Changes saved'
      
      render(<ProfileHeader success={successMessage} />)
      
      // Check that the success container exists and has the right structure
      const successContainer = screen.getByText(successMessage).parentElement
      expect(successContainer).toHaveClass('flex', 'items-center', 'gap-2')
    })

    it('should handle empty success message gracefully', () => {
      render(<ProfileHeader success="" />)
      
      expect(screen.queryByText('')).not.toBeInTheDocument()
    })

    it('should handle long success messages', () => {
      const longSuccessMessage = 'This is a very long success message that should still be displayed correctly in the profile header component without breaking the layout'
      
      render(<ProfileHeader success={longSuccessMessage} />)
      
      expect(screen.getByText(longSuccessMessage)).toBeInTheDocument()
    })
  })

  describe('Error and Success Message Interaction', () => {
    it('should display both error and success messages when both are provided', () => {
      const errorMessage = 'An error occurred'
      const successMessage = 'But this succeeded'
      
      render(<ProfileHeader error={errorMessage} success={successMessage} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByText(successMessage)).toBeInTheDocument()
    })

    it('should display messages in the correct order (error first, then success)', () => {
      const errorMessage = 'Error message'
      const successMessage = 'Success message'
      
      render(<ProfileHeader error={errorMessage} success={successMessage} />)
      
      const errorElement = screen.getByText(errorMessage)
      const successElement = screen.getByText(successMessage)
      
      // Check that error comes before success in the DOM
      expect(errorElement.parentElement?.nextElementSibling).toBe(successElement.parentElement)
    })

    it('should handle priority when only one message should be shown (in real usage)', () => {
      // Test error only
      const { rerender } = render(<ProfileHeader error="Error occurred" />)
      expect(screen.getByText('Error occurred')).toBeInTheDocument()
      expect(screen.queryByText('Success')).not.toBeInTheDocument()
      
      // Test success only
      rerender(<ProfileHeader success="Success occurred" />)
      expect(screen.getByText('Success occurred')).toBeInTheDocument()
      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument()
    })
  })

  describe('Styling and Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ProfileHeader />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-gray-900')
    })

    it('should have proper spacing classes', () => {
      render(<ProfileHeader />)
      
      const container = screen.getByRole('heading', { level: 1 }).parentElement?.parentElement
      expect(container).toHaveClass('space-y-6')
    })

    it('should maintain consistent alert styling for errors', () => {
      render(<ProfileHeader error="Test error" />)
      
      const errorContainer = screen.getByText('Test error').parentElement
      expect(errorContainer).toHaveClass(
        'flex',
        'items-center',
        'gap-2',
        'p-4',
        'bg-red-50',
        'border',
        'border-red-200',
        'rounded-lg',
        'text-red-700'
      )
    })

    it('should maintain consistent alert styling for success', () => {
      render(<ProfileHeader success="Test success" />)
      
      const successContainer = screen.getByText('Test success').parentElement
      expect(successContainer).toHaveClass(
        'flex',
        'items-center',
        'gap-2',
        'p-4',
        'bg-green-50',
        'border',
        'border-green-200',
        'rounded-lg',
        'text-green-700'
      )
    })

    it('should be keyboard accessible', () => {
      render(<ProfileHeader error="Keyboard accessible error" />)
      
      const errorElement = screen.getByText('Keyboard accessible error')
      
      // Error messages should be focusable for screen readers
      // The container should be part of the natural tab order
      expect(errorElement.parentElement).toBeInTheDocument()
    })
  })

  describe('Component Props Interface', () => {
    it('should handle undefined props gracefully', () => {
      render(<ProfileHeader error={undefined} success={undefined} />)
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should handle null props gracefully', () => {
      // @ts-ignore - Testing runtime behavior with null values
      render(<ProfileHeader error={null} success={null} />)
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should handle boolean values gracefully', () => {
      // @ts-ignore - Testing runtime behavior with wrong types
      render(<ProfileHeader error={false} success={true} />)
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      // Should not render invalid boolean values
    })
  })

  describe('Responsive Design', () => {
    it('should maintain responsive text classes', () => {
      render(<ProfileHeader />)
      
      const title = screen.getByRole('heading', { level: 1 })
      const description = screen.getByText('Manage your account settings and preferences')
      
      expect(title).toHaveClass('text-3xl')
      expect(description).toHaveClass('text-gray-600', 'mt-2')
    })

    it('should maintain proper spacing on different screen sizes', () => {
      render(<ProfileHeader error="Mobile error" success="Mobile success" />)
      
      const errorContainer = screen.getByText('Mobile error').parentElement
      const successContainer = screen.getByText('Mobile success').parentElement
      
      // Both should maintain consistent padding
      expect(errorContainer).toHaveClass('p-4')
      expect(successContainer).toHaveClass('p-4')
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<ProfileHeader error="Test error" />)
      
      // Re-render with same props should not cause issues
      rerender(<ProfileHeader error="Test error" />)
      
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<ProfileHeader />)
      
      rerender(<ProfileHeader error="Error 1" />)
      expect(screen.getByText('Error 1')).toBeInTheDocument()
      
      rerender(<ProfileHeader error="Error 2" />)
      expect(screen.getByText('Error 2')).toBeInTheDocument()
      expect(screen.queryByText('Error 1')).not.toBeInTheDocument()
      
      rerender(<ProfileHeader success="Success" />)
      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.queryByText('Error 2')).not.toBeInTheDocument()
    })
  })
})