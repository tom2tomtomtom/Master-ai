import type NextAuth from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id: string
    role?: UserRole
    subscriptionTier?: string
    subscriptionStatus?: string
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: UserRole
      subscriptionTier?: string
      subscriptionStatus?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: UserRole
    subscriptionTier?: string
    subscriptionStatus?: string
  }
}