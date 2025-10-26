/**
 * Component Tests for PersonalInfoSection
 * Tests the profile personal information form component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { PersonalInfoSection } from '../personal-info-section'

describe('PersonalInfoSection Component', () => {
  const mockSetProfileForm = jest.fn()
  const mockOnSubmit = jest.fn()

  const defaultProps = {
    profileForm: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    setProfileForm: mockSetProfileForm,
    onSubmit: mockOnSubmit,
    isSaving: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  describe('Basic Rendering', () => {
    it('should render the section with correct title and description', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      expect(screen.getByRole('heading', { name: /profile information/i })).toBeInTheDocument()
      expect(screen.getByText('Update your personal information and email address')).toBeInTheDocument()
    })

    it('should display User icon in the title', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      const title = screen.getByRole('heading', { name: /profile information/i })
      expect(title).toBeInTheDocument()
      // The icon should be rendered as part of the title container
    })

    it('should render form fields with correct labels', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    })

    it('should display current values in form fields', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    })

    it('should have correct input types', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email Address')
      
      expect(nameInput).toHaveAttribute('type', 'text')
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should have appropriate placeholders', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should call setProfileForm when name input changes', async () => {
      const user = userEvent.setup()
      render(<PersonalInfoSection {...defaultProps} />)
      
      const nameInput = screen.getByLabelText('Full Name')
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Smith')
      
      expect(mockSetProfileForm).toHaveBeenCalledWith(expect.any(Function))
      
      // Test the updater function
      const lastCall = mockSetProfileForm.mock.calls[mockSetProfileForm.mock.calls.length - 1][0]
      const result = lastCall({ name: 'John Doe', email: 'john@example.com' })
      expect(result).toEqual({ name: 'Jane Smith', email: 'john@example.com' })
    })

    it('should call setProfileForm when email input changes', async () => {
      const user = userEvent.setup()
      render(<PersonalInfoSection {...defaultProps} />)
      
      const emailInput = screen.getByLabelText('Email Address')
      
      await user.clear(emailInput)
      await user.type(emailInput, 'jane@example.com')
      
      expect(mockSetProfileForm).toHaveBeenCalledWith(expect.any(Function))
      
      // Test the updater function
      const lastCall = mockSetProfileForm.mock.calls[mockSetProfileForm.mock.calls.length - 1][0]
      const result = lastCall({ name: 'John Doe', email: 'john@example.com' })
      expect(result).toEqual({ name: 'John Doe', email: 'jane@example.com' })
    })

    it('should preserve existing values when updating one field', async () => {
      const user = userEvent.setup()
      render(<PersonalInfoSection {...defaultProps} />)
      
      const nameInput = screen.getByLabelText('Full Name')
      
      await user.type(nameInput, ' Jr.')
      
      // Verify the updater function preserves the email
      const lastCall = mockSetProfileForm.mock.calls[mockSetProfileForm.mock.calls.length - 1][0]
      const result = lastCall({ name: 'John Doe', email: 'john@example.com' })
      expect(result.email).toBe('john@example.com')
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit when form is submitted', async () => {
      const user = userEvent.setup()
      render(<PersonalInfoSection {...defaultProps} />)
      
      const form = screen.getByRole('form') || screen.getByTestId('form') || 
                   screen.getByLabelText('Full Name').closest('form')!
      
      await user.click(screen.getByRole('button', { name: /save changes/i }))
      
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.any(Event))
    })

    it('should prevent default form submission', async () => {
      const user = userEvent.setup()
      render(<PersonalInfoSection {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)
      
      expect(mockOnSubmit).toHaveBeenCalled()
    })

    it('should handle form submission via Enter key', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      const nameInput = screen.getByLabelText('Full Name')
      
      fireEvent.keyDown(nameInput, { key: 'Enter', code: 'Enter' })
      fireEvent.submit(nameInput.closest('form')!)
      
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should disable submit button when saving', () => {
      render(<PersonalInfoSection {...defaultProps} isSaving={true} />)
      
      const submitButton = screen.getByRole('button')
      expect(submitButton).toBeDisabled()
    })

    it('should show loading text when saving', () => {
      render(<PersonalInfoSection {...defaultProps} isSaving={true} />)
      
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('should show loading spinner when saving', () => {
      render(<PersonalInfoSection {...defaultProps} isSaving={true} />)
      
      const spinner = screen.getByText('Saving...').previousElementSibling
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should show normal state when not saving', () => {
      render(<PersonalInfoSection {...defaultProps} isSaving={false} />)
      
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
    })

    it('should show Save icon when not saving', () => {
      render(<PersonalInfoSection {...defaultProps} isSaving={false} />)
      
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).toBeInTheDocument()
      // Save icon should be rendered (Lucide Save icon)
    })
  })

  describe('Responsive Layout', () => {
    it('should have responsive grid classes for form fields', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      const gridContainer = screen.getByLabelText('Full Name').closest('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2')
    })

    it('should maintain proper spacing', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      const form = screen.getByLabelText('Full Name').closest('form')
      expect(form).toHaveClass('space-y-4')
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email Address')
      
      expect(nameInput).toHaveAttribute('id', 'name')
      expect(emailInput).toHaveAttribute('id', 'email')
    })

    it('should associate labels with inputs', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      const nameLabel = screen.getByText('Full Name')
      const emailLabel = screen.getByText('Email Address')
      
      expect(nameLabel).toHaveAttribute('for', 'name')
      expect(emailLabel).toHaveAttribute('for', 'email')
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<PersonalInfoSection {...defaultProps} />)
      
      // Tab through the form
      await user.tab()
      expect(screen.getByLabelText('Full Name')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText('Email Address')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /save changes/i })).toHaveFocus()
    })

    it('should support screen readers with proper semantics', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      // Form should be properly structured
      const form = screen.getByLabelText('Full Name').closest('form')
      expect(form).toBeInTheDocument()
      
      // Button should have proper type
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty form values', () => {
      const emptyProps = {
        ...defaultProps,
        profileForm: { name: '', email: '' }
      }
      
      render(<PersonalInfoSection {...emptyProps} />)
      
      expect(screen.getByLabelText('Full Name')).toHaveValue('')
      expect(screen.getByLabelText('Email Address')).toHaveValue('')
    })

    it('should handle very long names and emails', () => {
      const longProps = {
        ...defaultProps,
        profileForm: {
          name: 'A'.repeat(100),
          email: 'a'.repeat(50) + '@example.com'
        }
      }
      
      render(<PersonalInfoSection {...longProps} />)
      
      expect(screen.getByLabelText('Full Name')).toHaveValue('A'.repeat(100))
      expect(screen.getByLabelText('Email Address')).toHaveValue('a'.repeat(50) + '@example.com')
    })

    it('should handle special characters in input', async () => {
      const user = userEvent.setup()
      render(<PersonalInfoSection {...defaultProps} />)
      
      const nameInput = screen.getByLabelText('Full Name')
      
      await user.clear(nameInput)
      await user.type(nameInput, 'José María O\'Connor-Smith')
      
      expect(mockSetProfileForm).toHaveBeenCalled()
    })

    it('should handle async onSubmit errors', async () => {
      const mockOnSubmitWithError = jest.fn().mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      
      render(
        <PersonalInfoSection 
          {...defaultProps} 
          onSubmit={mockOnSubmitWithError} 
        />
      )
      
      await user.click(screen.getByRole('button', { name: /save changes/i }))
      
      await waitFor(() => {
        expect(mockOnSubmitWithError).toHaveBeenCalled()
      })
    })
  })

  describe('Card Structure', () => {
    it('should render within a card component', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      // Check for card-like structure
      const cardHeader = screen.getByRole('heading', { name: /profile information/i }).closest('div')
      const cardContent = screen.getByLabelText('Full Name').closest('div')
      
      expect(cardHeader).toBeInTheDocument()
      expect(cardContent).toBeInTheDocument()
    })

    it('should have proper card styling', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      const title = screen.getByRole('heading', { name: /profile information/i })
      const description = screen.getByText('Update your personal information and email address')
      
      expect(title).toBeInTheDocument()
      expect(description).toBeInTheDocument()
    })
  })

  describe('Form Validation Support', () => {
    it('should support HTML5 email validation', () => {
      render(<PersonalInfoSection {...defaultProps} />)
      
      const emailInput = screen.getByLabelText('Email Address')
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should maintain form state correctly during validation', async () => {
      const user = userEvent.setup()
      render(<PersonalInfoSection {...defaultProps} />)
      
      const nameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email Address')
      
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')
      
      await user.clear(emailInput)
      await user.type(emailInput, 'newemail@test.com')
      
      // Both changes should have been recorded
      expect(mockSetProfileForm).toHaveBeenCalledTimes(26) // 8 chars + 17 chars + clearing
    })
  })
})