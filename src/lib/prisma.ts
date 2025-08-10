import { PrismaClient } from '@prisma/client'
import { LoggedPrismaClient, prismaLoggingExtension, monitorDatabaseConnections } from './prisma-logging'
import { appLogger } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: LoggedPrismaClient | undefined
}

/**
 * Production-optimized Prisma client with enhanced Supabase connectivity
 */
const createPrismaClient = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  try {
    const databaseUrl = validateDatabaseUrl()
    
    // Create LoggedPrismaClient with enhanced logging capabilities
    const client = new LoggedPrismaClient({
      log: isProduction 
        ? [{ emit: 'event', level: 'error' }]
        : [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' }
          ],
      errorFormat: 'pretty',
      // Use validated database URL with fallback
      datasourceUrl: databaseUrl,
    })

    // The client already includes logging capabilities
    const enhancedClient = client

    // Log client creation
    appLogger.system.startup({
      component: 'prisma_client',
      environment: process.env.NODE_ENV,
      databaseType: databaseUrl.includes('pooler.supabase.com') ? 'supabase_pooler' : 'direct'
    })

    // Start database connection monitoring in production
    if (isProduction) {
      monitorDatabaseConnections(enhancedClient)
    }

    return enhancedClient
  } catch (error) {
    appLogger.errors.unhandledError(
      error instanceof Error ? error : new Error(String(error)), 
      { component: 'prisma_client_creation' }
    )
    throw error
  }
}

// Database URL validation and fallback logic
function validateDatabaseUrl(): string {
  const directUrl = process.env.DIRECT_DATABASE_URL
  const pooledUrl = process.env.DATABASE_URL
  
  if (directUrl && directUrl.trim() !== '') {
    appLogger.info('Using direct database connection', { component: 'database_config' })
    return directUrl.trim()
  }
  
  if (pooledUrl && pooledUrl.trim() !== '') {
    appLogger.info('Using pooled database connection', { component: 'database_config' })
    return pooledUrl.trim()
  }
  
  const error = new Error('No valid DATABASE_URL or DIRECT_DATABASE_URL found')
  appLogger.errors.unhandledError(error, { component: 'database_config' })
  throw error
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Enhanced connection management for production
let isConnected = false
let connectionRetries = 0
const MAX_RETRIES = 3

/**
 * Enhanced database connection with Supabase-specific retry logic
 */
export async function ensureConnection(): Promise<boolean> {
  if (isConnected) return true
  
  const maxRetries = 3
  let attempt = 0
  
  while (attempt < maxRetries) {
    attempt++
    connectionRetries = attempt
    
    try {
      console.log(`🔌 Database connection attempt ${attempt}/${maxRetries}...`)
      
      // Test connection with a lightweight query
      const result = await prisma.$queryRaw`SELECT 1 as test`
      
      if (result) {
        console.log('✅ Database connection successful')
        isConnected = true
        connectionRetries = 0
        return true
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Connection attempt ${attempt} failed:`, errorMessage)
      
      // Specific handling for Supabase/PostgreSQL errors
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('pooler.supabase.com')) {
        console.log('🔄 Supabase pooler connection failed, will retry...')
      } else if (errorMessage.includes('connection limit')) {
        console.log('🚫 Connection pool limit reached, waiting longer...')
      }
      
      // Don't wait on final attempt
      if (attempt < maxRetries) {
        const waitTime = Math.min(2000 * attempt, 8000) // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  console.error('🚨 All database connection attempts failed. Using fallback mode.')
  return false
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