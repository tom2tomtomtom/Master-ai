import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Enhanced Prisma client with production-optimized connection handling
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  errorFormat: 'pretty',
  // Enhanced connection settings for serverless
  __internal: {
    engine: {
      connectTimeout: 20000, // 20 seconds
      acquireTimeout: 20000,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Enhanced connection management for production
let isConnected = false
let connectionRetries = 0
const MAX_RETRIES = 3

/**
 * Ensures database connection with retry logic
 */
export async function ensureConnection(): Promise<boolean> {
  if (isConnected) return true
  
  try {
    await prisma.$connect()
    isConnected = true
    connectionRetries = 0
    return true
  } catch (error) {
    connectionRetries++
    console.error(`Database connection attempt ${connectionRetries}/${MAX_RETRIES} failed:`, error)
    
    if (connectionRetries < MAX_RETRIES) {
      // Wait before retry with exponential backoff
      const waitTime = Math.min(1000 * Math.pow(2, connectionRetries - 1), 10000)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return ensureConnection()
    }
    
    return false
  }
}

/**
 * Safe database query wrapper with connection retry
 */
export async function safeQuery<T>(queryFn: () => Promise<T>, fallback?: T): Promise<T | null> {
  try {
    const connected = await ensureConnection()
    if (!connected) {
      console.warn('Database connection failed, using fallback')
      return fallback || null
    }
    
    return await queryFn()
  } catch (error) {
    console.error('Database query failed:', error)
    return fallback || null
  }
}

// Optimize Prisma client settings on initialization
if (process.env.NODE_ENV !== 'production') {
  // Connection pool monitoring (development only)
  try {
    (prisma as any).$on('query', (e: any) => {
      if (e.duration > 1000) { // Log slow queries (>1s)
        console.warn(`🐌 Slow query detected (${e.duration}ms):`, e.query.substring(0, 100))
      }
    })
  } catch (error) {
    // Query logging not available in this Prisma version
  }
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
  console.log('Disconnecting from database...')
  await prisma.$disconnect()
}) 