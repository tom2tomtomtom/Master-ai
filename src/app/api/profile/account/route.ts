import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  confirmEmail: z.string().email('Invalid email address'),
  confirmText: z.string().refine(
    (val) => val === 'DELETE MY ACCOUNT',
    'Please type "DELETE MY ACCOUNT" to confirm'
  )
});

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = deleteAccountSchema.parse(body);

    // Get user to verify email
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
      }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify email matches
    if (dbUser.email !== validatedData.confirmEmail) {
      return NextResponse.json(
        { error: 'Email confirmation does not match your account email' },
        { status: 400 }
      );
    }

    // Delete user and all related data (cascade will handle relationships)
    await prisma.user.delete({
      where: { id: user.id }
    });

    return NextResponse.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    
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