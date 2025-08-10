import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase-auth-middleware'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const invoicesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(req.url)
    const { limit, offset } = invoicesQuerySchema.parse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    })

    // Get user invoices from database
    const [invoices, totalCount] = await Promise.all([
      prisma.stripeInvoice.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.stripeInvoice.count({
        where: {
          userId: user.id,
        },
      }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      }
    })

  } catch (error) {
    console.error('Error fetching invoices:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}