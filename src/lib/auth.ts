import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // debug logs only if enabled via env
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  // Allow linking OAuth to existing email-based users (avoid duplicate email conflicts)
  allowDangerousEmailAccountLinking: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          subscriptionTier: user.subscriptionTier,
        }
      }
    }),
    ...(process.env.GOOGLE_CLIENT_ID && 
        process.env.GOOGLE_CLIENT_SECRET && 
        process.env.GOOGLE_CLIENT_ID.trim() !== '' && 
        process.env.GOOGLE_CLIENT_SECRET.trim() !== ''
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID.trim(),
            clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Allow credentials-based sign in
      if (account?.provider === "credentials") {
        return true
      }
      
      // For OAuth providers, ensure they're properly configured
      if (account?.provider === "google") {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET ||
            process.env.GOOGLE_CLIENT_ID.trim() === '' || 
            process.env.GOOGLE_CLIENT_SECRET.trim() === '') {
          console.error("Google OAuth attempted but credentials not properly configured")
          return false
        }
      }
      
      
      return true
    },
    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith('/')) return `${baseUrl}${url}`
        const urlOrigin = new URL(url).origin
        if (urlOrigin === baseUrl) return url
      } catch (_) {
        // fall through
      }
      return baseUrl
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
        }
      }
      
      // Fetch user data on every token refresh or when manually triggered
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              subscriptionTier: true,
              subscriptionStatus: true,
            }
          })
          
          if (dbUser) {
            token.subscriptionTier = dbUser.subscriptionTier
            token.subscriptionStatus = dbUser.subscriptionStatus
          }
        } catch (error) {
          console.error("Error fetching user data in JWT callback:", error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          subscriptionTier: token.subscriptionTier,
          subscriptionStatus: token.subscriptionStatus,
        },
      }
    },
  },
  // Extra diagnostics in production to capture callback errors
  events: {
    async error(message) {
      console.error("[next-auth][event.error]", message)
    },
    async signIn(message) {
      console.log("[next-auth][event.signIn]", message?.user?.email || message)
    },
    async linkAccount(message) {
      console.log("[next-auth][event.linkAccount]", message?.provider || message)
    },
    async createUser(message) {
      console.log("[next-auth][event.createUser]", message?.user?.email || message)
    },
  },
  logger: {
    error(code, metadata) {
      console.error("[next-auth][logger.error]", code, metadata)
    },
    warn(code) {
      console.warn("[next-auth][logger.warn]", code)
    },
    debug(code, metadata) {
      console.debug("[next-auth][logger.debug]", code, metadata)
    },
  },
} 