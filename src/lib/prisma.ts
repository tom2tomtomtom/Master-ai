import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Production-optimized Prisma client with serverless configuration
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  errorFormat: 'pretty',
  // Optimized for serverless environments
  __internal: {
    engine: {
      connectTimeout: 60000, // 60 seconds for serverless cold starts
      acquireTimeout: 60000,
      transactionOptions: {
        maxWait: 60000, // Wait up to 60 seconds to start a transaction
        timeout: 60000, // Allow up to 60 seconds for the transaction to complete
      },
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Enhanced connection management for production
let isConnected = false
let connectionRetries = 0
const MAX_RETRIES = 3

/**
 * Ensures database connection with enhanced retry logic for serverless
 */
export async function ensureConnection(): Promise<boolean> {
  if (isConnected) return true
  
  try {
    // Force a simple query to test connection
    await prisma.$queryRaw`SELECT 1`
    isConnected = true
    connectionRetries = 0
    return true
  } catch (error) {
    connectionRetries++
    console.error(`Database connection attempt ${connectionRetries}/${MAX_RETRIES} failed:`, error)
    
    if (connectionRetries < MAX_RETRIES) {
      // Progressive backoff: 2s, 5s, 10s
      const waitTime = connectionRetries === 1 ? 2000 : connectionRetries === 2 ? 5000 : 10000
      console.log(`Retrying connection in ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return ensureConnection()
    }
    
    console.error('All connection attempts failed. Using fallback mode.')
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

// Enhanced connection management for serverless
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect()
    isConnected = false
    console.log('✅ Database disconnected gracefully')
  } catch (error) {
    console.error('Error disconnecting from database:', error)
  }
}

// Connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT version()` 
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Graceful shutdown handling for serverless
process.on('beforeExit', disconnectPrisma)
process.on('SIGINT', disconnectPrisma)
process.on('SIGTERM', disconnectPrisma) 