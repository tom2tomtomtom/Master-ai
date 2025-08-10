/**
 * Test Utilities
 * Common testing utilities and helpers for the Master-AI test suite
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { jest } from '@jest/globals'

// Mock user data for testing
export const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
  role: 'USER',
  subscriptionTier: 'FREE',
  subscriptionStatus: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00.000Z',
  lastLoginAt: '2024-01-01T00:00:00.000Z',
}

// Mock authentication context
export const mockAuthContext = {
  user: mockUser,
  loading: false,
  signOut: jest.fn(),
}

// Create a custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock fetch response helper
export const mockFetchResponse = (data: any, status = 200, ok = true) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Map([['content-type', 'application/json']]),
  })
}

// Mock fetch error helper
export const mockFetchError = (error: string, status = 500) => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
    text: () => Promise.resolve(JSON.stringify({ error })),
    headers: new Map([['content-type', 'application/json']]),
  })
}

// Mock Supabase user
export const mockSupabaseUser = {
  id: 'supabase-user-id',
  email: 'test@example.com',
  user_metadata: { name: 'Test User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

// Mock Supabase session
export const mockSupabaseSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockSupabaseUser,
}

// Test data generators
export const generateMockProfile = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides,
})

export const generateMockLesson = (id: string = 'lesson-1') => ({
  id,
  title: 'Test Lesson',
  description: 'A test lesson',
  content: '# Test Lesson Content',
  difficulty: 'BEGINNER' as const,
  category: 'AI_TOOLS' as const,
  estimatedDuration: 30,
  order: 1,
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
})

// Wait for async operations
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock console methods for clean test output
export const mockConsole = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
}

// Cleanup function for tests
export const cleanupMocks = () => {
  jest.clearAllMocks()
  mockConsole.log.mockClear()
  mockConsole.error.mockClear()
  mockConsole.warn.mockClear()
}

// Assert helpers
export const expectToHaveBeenCalledWithFetch = (url: string, options?: any) => {
  expect(global.fetch).toHaveBeenCalledWith(url, options)
}

// DOM testing helpers
export const getByTestId = (testId: string) => {
  return document.querySelector(`[data-testid="${testId}"]`)
}

export const getAllByTestId = (testId: string) => {
  return document.querySelectorAll(`[data-testid="${testId}"]`)
}