import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaClient } from '@prisma/client'
import { isGoogleAuthEnabled } from './auth-config'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    ...(isGoogleAuthEnabled() ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      })
    ] : [])
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' && user.email) {
          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!existingUser) {
            // Create new user
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || '',
                image: user.image,
                emailVerified: new Date(),
                role: 'USER'
              }
            })
          }
        }
        return true
      } catch (error) {
        console.error('SignIn callback error:', error)
        return false
      }
    },

    async jwt({ token, user, account }) {
      if (account && user) {
        // Get user from database to include role and other info
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            subscriptionTier: true,
            subscriptionStatus: true
          }
        })

        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.subscriptionTier = dbUser.subscriptionTier
          token.subscriptionStatus = dbUser.subscriptionStatus
        }
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        // Extend the session user object with additional properties
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role as string
        ;(session.user as any).subscriptionTier = token.subscriptionTier as string
        ;(session.user as any).subscriptionStatus = token.subscriptionStatus as string
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
}