import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction, handleAuthError, hasSuperAdminRole } from '@/lib/supabase-auth-middleware';
import { PrismaClient, UserRole } from '@prisma/client';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// PUT /api/admin/users/[userId]/role - Update user role (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await requireAdmin();
    const resolvedParams = await params;
    const targetUserId = resolvedParams.userId;

    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Security checks
    // 1. Cannot modify own role
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 403 }
      );
    }

    // 2. Only SUPER_ADMIN can promote to SUPER_ADMIN
    if (role === UserRole.SUPER_ADMIN && !hasSuperAdminRole(user)) {
      return NextResponse.json(
        { error: 'Only super admins can assign super admin role' },
        { status: 403 }
      );
    }

    // 3. Only SUPER_ADMIN can demote other SUPER_ADMIN users
    if (targetUser.role === UserRole.SUPER_ADMIN && !hasSuperAdminRole(user)) {
      return NextResponse.json(
        { error: 'Only super admins can modify super admin roles' },
        { status: 403 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    });

    // Log admin action
    await logAdminAction(user, 'UPDATE_USER_ROLE', {
      targetUserId,
      targetUserEmail: targetUser.email,
      previousRole: targetUser.role,
      newRole: role
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User role updated from ${targetUser.role} to ${role}`
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}