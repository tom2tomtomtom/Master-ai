import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = deleteAccountSchema.parse(body);

    // Get user to verify email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify email matches
    if (user.email !== validatedData.confirmEmail) {
      return NextResponse.json(
        { error: 'Email confirmation does not match your account email' },
        { status: 400 }
      );
    }

    // Delete user and all related data (cascade will handle relationships)
    await prisma.user.delete({
      where: { id: session.user.id }
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