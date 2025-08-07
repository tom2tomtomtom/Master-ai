import { z } from 'zod';

// Utility validation functions
export function validateEmail(email: string): boolean {
  const emailSchema = z.string().email();
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): boolean {
  // Password requirements: min 8 chars, uppercase, lowercase, number, special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Auth validation schemas
export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  subscriptionTier: z.enum(['free', 'pro', 'team', 'enterprise']).default('free'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Profile validation schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});

export const deleteAccountSchema = z.object({
  confirmEmail: z.string().email('Invalid email address'),
  confirmText: z.string().refine(
    (val) => val === 'DELETE MY ACCOUNT',
    'Please type "DELETE MY ACCOUNT" to confirm'
  )
});

// Password reset validation schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const verifyResetTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

// Helper function to format validation errors
export function formatValidationErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  
  error.issues.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
}

// Helper function to validate password strength
export function validatePasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    score,
    checks,
    percentage: (score / 5) * 100,
    label: score <= 1 ? 'Weak' : score <= 3 ? 'Medium' : score <= 4 ? 'Strong' : 'Very Strong',
    isStrong: score >= 4
  };
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Common error messages
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  USER_EXISTS: 'An account with this email already exists.',
  USER_NOT_FOUND: 'No account found with this email address.',
  WEAK_PASSWORD: 'Password is too weak. Please choose a stronger password.',
  PASSWORDS_DONT_MATCH: "Passwords don't match.",
  INVALID_EMAIL: 'Please enter a valid email address.',
  REQUIRED_FIELD: 'This field is required.',
  TERMS_NOT_ACCEPTED: 'You must accept the terms and conditions.',
  PRIVACY_NOT_ACCEPTED: 'You must accept the privacy policy.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  
  // Password reset errors
  RESET_TOKEN_INVALID: 'Invalid or expired reset token. Please request a new password reset.',
  RESET_TOKEN_EXPIRED: 'Password reset token has expired. Please request a new password reset.',
  RESET_TOKEN_USED: 'This password reset token has already been used.',
  RESET_EMAIL_FAILED: 'Failed to send password reset email. Please try again.',
  RESET_RATE_LIMIT: 'Too many password reset attempts. Please wait before trying again.',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully.',
  RESET_EMAIL_SENT: 'Password reset instructions have been sent to your email.',
} as const;