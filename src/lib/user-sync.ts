import { prisma } from '@/lib/prisma'
import { appLogger } from '@/lib/logger'
import type { User } from '@supabase/supabase-js'

/**
 * Sync Supabase user with Prisma database
 * Creates or updates user record when they sign in
 */
export async function syncUser(supabaseUser: User) {
  try {
    const { id, email, user_metadata } = supabaseUser
    
    if (!email) {
      appLogger.logError('Cannot sync user without email', { userId: id })
      return null
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Update existing user with latest info from Supabase
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          name: user_metadata?.name || user_metadata?.full_name || existingUser.name,
          image: user_metadata?.avatar_url || user_metadata?.picture || existingUser.image,
          // Keep existing subscription info
        },
      })
      appLogger.info('User synchronized - updated existing user', { 
        email, 
        userId: id,
        hasName: !!updatedUser.name,
        hasImage: !!updatedUser.image 
      })
      return updatedUser
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          id, // Use Supabase user ID
          email,
          name: user_metadata?.name || user_metadata?.full_name || null,
          image: user_metadata?.avatar_url || user_metadata?.picture || null,
          role: 'USER',
          subscriptionTier: 'free',
          subscriptionStatus: 'ACTIVE',
        },
      })
      appLogger.info('User synchronized - created new user', { 
        email, 
        userId: id,
        name: newUser.name,
        subscriptionTier: newUser.subscriptionTier 
      })
      return newUser
    }
  } catch (error) {
    appLogger.errors.databaseError('user_sync', error as Error, { 
      userId: supabaseUser.id,
      email: supabaseUser.email 
    })
    return null
  }
}

/**
 * Get or create user from Supabase user data
 */
export async function getOrCreateUser(supabaseUser: User) {
  return syncUser(supabaseUser)
}