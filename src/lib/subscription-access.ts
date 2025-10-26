import { prisma } from '@/lib/prisma'
import { SUBSCRIPTION_TIERS } from '@/lib/stripe'

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise'

export interface AccessControlResult {
  hasAccess: boolean
  reason?: string
  requiredTier?: SubscriptionTier
  currentTier: SubscriptionTier
  upgradeUrl?: string
}

export interface UserSubscriptionInfo {
  id: string
  tier: SubscriptionTier
  status: string
  isActive: boolean
  isPastDue: boolean
  isTrialing: boolean
  subscriptionEndsAt: Date | null
  trialEndsAt: Date | null
}

// Feature access mapping
export const FEATURE_ACCESS = {
  // Lessons access
  basicLessons: ['free', 'pro', 'team', 'enterprise'] as SubscriptionTier[],
  allLessons: ['pro', 'team', 'enterprise'] as SubscriptionTier[],
  
  // Interactive features
  exercises: ['pro', 'team', 'enterprise'] as SubscriptionTier[],
  projectSubmissions: ['pro', 'team', 'enterprise'] as SubscriptionTier[],
  
  // Certificates and achievements
  certificates: ['pro', 'team', 'enterprise'] as SubscriptionTier[],
  achievements: ['free', 'pro', 'team', 'enterprise'] as SubscriptionTier[],
  
  // Analytics and progress
  basicAnalytics: ['free', 'pro', 'team', 'enterprise'] as SubscriptionTier[],
  advancedAnalytics: ['pro', 'team', 'enterprise'] as SubscriptionTier[],
  
  // Notes and bookmarks
  basicNotes: ['free', 'pro', 'team', 'enterprise'] as SubscriptionTier[],
  unlimitedNotes: ['pro', 'team', 'enterprise'] as SubscriptionTier[],
  
  // Team features
  teamDashboard: ['team', 'enterprise'] as SubscriptionTier[],
  teamAnalytics: ['team', 'enterprise'] as SubscriptionTier[],
  customLearningPaths: ['team', 'enterprise'] as SubscriptionTier[],
  
  // Support levels
  communitySupport: ['free', 'pro', 'team', 'enterprise'] as SubscriptionTier[],
  emailSupport: ['pro', 'team', 'enterprise'] as SubscriptionTier[],
  prioritySupport: ['team', 'enterprise'] as SubscriptionTier[],
  dedicatedSupport: ['enterprise'] as SubscriptionTier[],
  
  // Content limits
  limitedContent: ['free'] as SubscriptionTier[],
  fullContent: ['pro', 'team', 'enterprise'] as SubscriptionTier[],
} as const

export type FeatureKey = keyof typeof FEATURE_ACCESS

// Free tier lesson limits
export const FREE_TIER_LIMITS = {
  maxLessons: 4, // Lesson 00 + 3 foundation lessons
  maxNotes: 10,
  maxBookmarks: 5,
  freeLessonNumbers: [0, 1, 2, 3], // First 4 lessons are free
}

export async function getUserSubscriptionInfo(userId: string): Promise<UserSubscriptionInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      trialEndsAt: true,
    },
  })

  if (!user) {
    return null
  }

  const tier = user.subscriptionTier as SubscriptionTier
  const isActive = user.subscriptionStatus === 'active'
  const isPastDue = user.subscriptionStatus === 'past_due'
  const isTrialing = user.subscriptionStatus === 'trialing'

  return {
    id: user.id,
    tier,
    status: user.subscriptionStatus,
    isActive,
    isPastDue,
    isTrialing,
    subscriptionEndsAt: user.subscriptionEndsAt,
    trialEndsAt: user.trialEndsAt,
  }
}

export function checkFeatureAccess(
  userTier: SubscriptionTier,
  feature: FeatureKey,
  userStatus: string = 'active'
): AccessControlResult {
  const allowedTiers = FEATURE_ACCESS[feature]
  const hasAccess = allowedTiers.includes(userTier)
  
  // If user has past due status, only allow basic features
  if (userStatus === 'past_due' && !['basicLessons', 'communitySupport', 'basicAnalytics'].includes(feature)) {
    return {
      hasAccess: false,
      reason: 'Payment past due',
      requiredTier: userTier,
      currentTier: userTier,
      upgradeUrl: '/dashboard/billing',
    }
  }

  if (hasAccess) {
    return {
      hasAccess: true,
      currentTier: userTier,
    }
  }

  // Find the minimum required tier
  const tierHierarchy: SubscriptionTier[] = ['free', 'pro', 'team', 'enterprise']
  const requiredTier = allowedTiers.find(tier => 
    tierHierarchy.indexOf(tier) > tierHierarchy.indexOf(userTier)
  ) || 'pro'

  return {
    hasAccess: false,
    reason: `This feature requires ${requiredTier} subscription`,
    requiredTier,
    currentTier: userTier,
    upgradeUrl: '/dashboard/billing',
  }
}

export async function checkLessonAccess(
  userId: string,
  lessonNumber: number
): Promise<AccessControlResult> {
  const userInfo = await getUserSubscriptionInfo(userId)
  
  if (!userInfo) {
    return {
      hasAccess: false,
      reason: 'User not found',
      currentTier: 'free',
    }
  }

  // Check if lesson is free
  if (FREE_TIER_LIMITS.freeLessonNumbers.includes(lessonNumber)) {
    return {
      hasAccess: true,
      currentTier: userInfo.tier,
    }
  }

  // Check if user has paid subscription
  const accessResult = checkFeatureAccess(userInfo.tier, 'allLessons', userInfo.status)
  
  if (!accessResult.hasAccess) {
    return {
      ...accessResult,
      reason: `Lesson ${lessonNumber} requires a Pro subscription or higher`,
    }
  }

  return accessResult
}

export async function checkExerciseAccess(userId: string): Promise<AccessControlResult> {
  const userInfo = await getUserSubscriptionInfo(userId)
  
  if (!userInfo) {
    return {
      hasAccess: false,
      reason: 'User not found',
      currentTier: 'free',
    }
  }

  return checkFeatureAccess(userInfo.tier, 'exercises', userInfo.status)
}

export async function checkCertificateAccess(userId: string): Promise<AccessControlResult> {
  const userInfo = await getUserSubscriptionInfo(userId)
  
  if (!userInfo) {
    return {
      hasAccess: false,
      reason: 'User not found',
      currentTier: 'free',
    }
  }

  return checkFeatureAccess(userInfo.tier, 'certificates', userInfo.status)
}

export async function checkTeamAccess(userId: string): Promise<AccessControlResult> {
  const userInfo = await getUserSubscriptionInfo(userId)
  
  if (!userInfo) {
    return {
      hasAccess: false,
      reason: 'User not found',
      currentTier: 'free',
    }
  }

  return checkFeatureAccess(userInfo.tier, 'teamDashboard', userInfo.status)
}

export async function checkNotesLimit(userId: string): Promise<{
  canCreateNote: boolean
  currentCount: number
  limit: number | null
  reason?: string
}> {
  const userInfo = await getUserSubscriptionInfo(userId)
  
  if (!userInfo) {
    return {
      canCreateNote: false,
      currentCount: 0,
      limit: null,
      reason: 'User not found',
    }
  }

  // Pro and above have unlimited notes
  if (userInfo.tier !== 'free') {
    return {
      canCreateNote: true,
      currentCount: 0,
      limit: null,
    }
  }

  // Check current note count for free users
  const currentCount = await prisma.lessonNote.count({
    where: { userId },
  })

  const canCreateNote = currentCount < FREE_TIER_LIMITS.maxNotes

  return {
    canCreateNote,
    currentCount,
    limit: FREE_TIER_LIMITS.maxNotes,
    reason: canCreateNote ? undefined : 'Note limit reached. Upgrade to Pro for unlimited notes.',
  }
}

export async function checkBookmarksLimit(userId: string): Promise<{
  canCreateBookmark: boolean
  currentCount: number
  limit: number | null
  reason?: string
}> {
  const userInfo = await getUserSubscriptionInfo(userId)
  
  if (!userInfo) {
    return {
      canCreateBookmark: false,
      currentCount: 0,
      limit: null,
      reason: 'User not found',
    }
  }

  // Pro and above have unlimited bookmarks
  if (userInfo.tier !== 'free') {
    return {
      canCreateBookmark: true,
      currentCount: 0,
      limit: null,
    }
  }

  // Check current bookmark count for free users
  const currentCount = await prisma.lessonBookmark.count({
    where: { userId },
  })

  const canCreateBookmark = currentCount < FREE_TIER_LIMITS.maxBookmarks

  return {
    canCreateBookmark,
    currentCount,
    limit: FREE_TIER_LIMITS.maxBookmarks,
    reason: canCreateBookmark ? undefined : 'Bookmark limit reached. Upgrade to Pro for unlimited bookmarks.',
  }
}

// Helper function to get upgrade message based on feature
export function getUpgradeMessage(feature: FeatureKey, currentTier: SubscriptionTier): string {
  const requiredTiers = FEATURE_ACCESS[feature]
  const nextTier = requiredTiers.find(tier => 
    ['free', 'pro', 'team', 'enterprise'].indexOf(tier) > 
    ['free', 'pro', 'team', 'enterprise'].indexOf(currentTier)
  )

  const tierConfig = nextTier ? SUBSCRIPTION_TIERS[nextTier] : null

  switch (feature) {
    case 'allLessons':
      return `Unlock all 81 lessons with a ${tierConfig?.name || 'Pro'} subscription`
    case 'exercises':
      return `Access interactive exercises with a ${tierConfig?.name || 'Pro'} subscription`
    case 'certificates':
      return `Earn professional certificates with a ${tierConfig?.name || 'Pro'} subscription`
    case 'teamDashboard':
      return `Manage your team with a ${tierConfig?.name || 'Team'} subscription`
    case 'advancedAnalytics':
      return `View detailed analytics with a ${tierConfig?.name || 'Pro'} subscription`
    default:
      return `This feature requires a ${tierConfig?.name || 'higher'} subscription`
  }
}