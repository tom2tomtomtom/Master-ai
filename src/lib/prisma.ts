import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Optimized Prisma client with connection pooling and performance settings
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
  // Connection pooling optimization
  // Note: These are handled at the database URL level for PostgreSQL
  // Example: DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=20&pool_timeout=60"
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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