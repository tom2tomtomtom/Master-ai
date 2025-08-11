import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import { z } from 'zod';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
});

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            provider: true,
            type: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  } catch (error) {
    appLogger.errors.apiError('profile-fetch', error as Error, {
      endpoint: '/api/profile'
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if email is already taken by another user
    if (validatedData.email) {
      const existingUser = await prisma.user.findUnique({
        where: { 
          email: validatedData.email,
          NOT: { id: authUser.id }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already in use by another account' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    appLogger.errors.apiError('profile-update', error as Error, {
      endpoint: '/api/profile'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}