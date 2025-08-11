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
  const isBuildTime = process.env.VERCEL && process.env.VERCEL_ENV
  
  try {
    const databaseUrl = validateDatabaseUrl()
    
    // Configuration for production builds vs runtime
    const clientConfig: any = {
      errorFormat: 'pretty',
      datasourceUrl: databaseUrl,
    }

    // Optimize logging for different environments
    if (isProduction && !isBuildTime) {
      // Production runtime - minimal logging
      clientConfig.log = [{ emit: 'event', level: 'error' }]
    } else if (isBuildTime) {
      // Build time - no logging to avoid build issues
      clientConfig.log = []
    } else {
      // Development - full logging
      clientConfig.log = [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' }
      ]
    }

    // Production-specific connection optimizations
    if (isProduction || isBuildTime) {
      // Add connection timeout for production
      if (databaseUrl.includes('supabase.com')) {
        // For Supabase connections, add specific parameters
        const urlWithTimeout = databaseUrl.includes('connect_timeout') 
          ? databaseUrl 
          : databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'connect_timeout=10&pool_timeout=10'
        clientConfig.datasourceUrl = urlWithTimeout
      }
    }
    
    // Create LoggedPrismaClient with optimized config
    const client = new LoggedPrismaClient(clientConfig)

    // The client already includes logging capabilities
    const enhancedClient = client

    // Log client creation (only if not in build time)
    if (!isBuildTime) {
      appLogger.system.startup({
        component: 'prisma_client',
        environment: process.env.NODE_ENV,
        databaseType: databaseUrl.includes('pooler.supabase.com') ? 'supabase_pooler' : 'direct',
        buildTime: isBuildTime
      })
    }

    // Start database connection monitoring in production runtime only
    if (isProduction && !isBuildTime) {
      monitorDatabaseConnections(enhancedClient)
    }

    return enhancedClient
  } catch (error) {
    const errorToLog = error instanceof Error ? error : new Error(String(error))
    
    // Only log if not in build time to avoid build failures
    if (!isBuildTime) {
      appLogger.errors.unhandledError(errorToLog, { 
        component: 'prisma_client_creation',
        buildTime: isBuildTime
      })
    } else {
      console.error('Prisma client creation error during build:', errorToLog.message)
    }
    
    throw error
  }
}

// Database URL validation and fallback logic
function validateDatabaseUrl(): string {
  const directUrl = process.env.DIRECT_DATABASE_URL?.trim().replace(/\\n$/, '')
  const pooledUrl = process.env.DATABASE_URL?.trim().replace(/\\n$/, '')
  const isProduction = process.env.NODE_ENV === 'production'
  const isBuildTime = process.env.VERCEL_ENV !== undefined && !process.env.VERCEL_URL?.includes('localhost')
  
  // For production builds, prefer direct connection to avoid pooler issues
  if (isProduction || isBuildTime) {
    if (directUrl && directUrl !== '') {
      appLogger.info('Using direct database connection for production/build', { component: 'database_config' })
      return directUrl
    }
  }
  
  // For runtime, use pooled connection if available
  if (pooledUrl && pooledUrl !== '') {
    appLogger.info('Using pooled database connection', { component: 'database_config' })
    return pooledUrl
  }
  
  if (directUrl && directUrl !== '') {
    appLogger.info('Using direct database connection as fallback', { component: 'database_config' })
    return directUrl
  }
  
  const error = new Error('No valid DATABASE_URL or DIRECT_DATABASE_URL found')
  appLogger.errors.unhandledError(error, { component: 'database_config' })
  throw error
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Enhanced connection management for production
let isConnected = false

/**
 * Enhanced database connection with Supabase-specific retry logic
 */
export async function ensureConnection(): Promise<boolean> {
  if (isConnected) return true
  
  const maxRetries = 3
  let attempt = 0
  const isBuildTime = process.env.VERCEL && process.env.VERCEL_ENV
  
  // In build time, reduce retries and timeout faster
  const effectiveMaxRetries = isBuildTime ? 1 : maxRetries
  
  while (attempt < effectiveMaxRetries) {
    attempt++
    
    try {
      console.log(`🔌 Database connection attempt ${attempt}/${effectiveMaxRetries}...`)
      
      // Create a timeout promise for build time
      const connectionPromise = prisma.$queryRaw`SELECT 1 as test`
      
      let result;
      if (isBuildTime) {
        // 3 second timeout for build time
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Build time connection timeout')), 3000)
        )
        result = await Promise.race([connectionPromise, timeoutPromise])
      } else {
        result = await connectionPromise
      }
      
      if (result) {
        console.log('✅ Database connection successful')
        isConnected = true
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
      } else if (errorMessage.includes('Build time connection timeout')) {
        console.log('⏱️  Build time connection timeout - proceeding with fallback')
        break
      }
      
      // Don't wait on final attempt or during build
      if (attempt < effectiveMaxRetries && !isBuildTime) {
        const waitTime = Math.min(2000 * attempt, 8000) // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  if (isBuildTime) {
    console.warn('⚠️  Database connection failed during build - fallback mode will be used at runtime')
  } else {
    console.error('🚨 All database connection attempts failed. Using fallback mode.')
  }
  return false
}

/**
 * Safe database query wrapper with connection retry and static generation support
 */
export async function safeQuery<T>(queryFn: () => Promise<T>, fallback?: T): Promise<T | null> {
  const isBuildTime = process.env.VERCEL && process.env.VERCEL_ENV
  const isProduction = process.env.NODE_ENV === 'production'
  
  try {
    // For build time, attempt direct connection with shorter timeout
    if (isBuildTime) {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Build time query timeout')), 5000)
      )
      
      const queryPromise = queryFn()
      
      try {
        return await Promise.race([queryPromise, timeoutPromise])
      } catch (buildError) {
        console.warn('Build time database query failed, using fallback:', 
          buildError instanceof Error ? buildError.message : 'Unknown error')
        return fallback || null
      }
    }
    
    // For runtime, use full connection retry logic
    const connected = await ensureConnection()
    if (!connected) {
      console.warn('Database connection failed, using fallback')
      return fallback || null
    }
    
    return await queryFn()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (isProduction && !isBuildTime) {
      console.error('Database query failed in production:', errorMessage)
    } else {
      console.error('Database query failed:', errorMessage)
    }
    
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