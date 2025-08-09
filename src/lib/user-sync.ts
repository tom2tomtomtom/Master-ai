import { prisma } from '@/lib/prisma'
import type { User } from '@supabase/supabase-js'

/**
 * Sync Supabase user with Prisma database
 * Creates or updates user record when they sign in
 */
export async function syncUser(supabaseUser: User) {
  try {
    const { id, email, user_metadata } = supabaseUser
    
    if (!email) {
      console.error('Cannot sync user without email:', id)
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
      console.log('✅ Updated existing user:', email)
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
      console.log('✅ Created new user:', email)
      return newUser
    }
  } catch (error) {
    console.error('❌ Error syncing user:', error)
    return null
  }
}

/**
 * Get or create user from Supabase user data
 */
export async function getOrCreateUser(supabaseUser: User) {
  return syncUser(supabaseUser)
}