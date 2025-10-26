import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    // Get current user with password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        password: true,
        accounts: {
          select: {
            provider: true
          }
        }
      }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has a password (not OAuth-only account)
    if (!dbUser.password) {
      return NextResponse.json(
        { error: 'Cannot change password for OAuth-only accounts. Please set a password first.' },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      dbUser.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    appLogger.errors.apiError('password-change', error as Error, {
      endpoint: '/api/profile/password'
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