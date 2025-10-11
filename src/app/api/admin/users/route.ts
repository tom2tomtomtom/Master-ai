import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import { UserRole, Prisma } from '@prisma/client';
import { z } from 'zod';

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic';

// GET /api/admin/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();

    // Validate query parameters
    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      role: z.nativeEnum(UserRole).optional(),
      search: z.string().optional()
    });

    const { searchParams } = new URL(request.url);
    const { page, limit, role, search } = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      role: searchParams.get('role'),
      search: searchParams.get('search')
    });

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.UserWhereInput = {};
    if (role) {
      whereClause.role = role;
    }
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          emailVerified: true,
          // Include some aggregate stats
          _count: {
            select: {
              progress: true,
              certifications: true,
              achievements: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      filters: {
        role,
        search
      }
    });

  } catch (error) {
    appLogger.errors.apiError('admin-users-list', error as Error, {
      endpoint: '/api/admin/users'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}