import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/**
 * Generate a secure password reset token
 */
export function generateResetToken(): { token: string; hashedToken: string } {
  // Generate a cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash the token before storing in database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return { token, hashedToken };
}

/**
 * Hash a token for comparison
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create password reset token for user
 */
export async function createPasswordResetToken(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { success: true };
    }

    // Generate secure token
    const { hashedToken } = generateResetToken();
    
    // Set token expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Update user with reset token
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpires: expiresAt,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Create password reset token error:', error);
    return { success: false, error: 'Failed to create reset token' };
  }
}

/**
 * Verify password reset token
 */
export async function verifyResetToken(token: string): Promise<{ 
  valid: boolean; 
  user?: { id: string; email: string; name: string | null }; 
  error?: string 
}> {
  try {
    if (!token) {
      return { valid: false, error: 'Token is required' };
    }

    // Hash the provided token
    const hashedToken = hashToken(token);

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        resetToken: true,
        resetTokenExpires: true,
      },
    });

    if (!user) {
      return { valid: false, error: 'Invalid or expired reset token' };
    }

    return { 
      valid: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    };
  } catch (error) {
    console.error('Verify reset token error:', error);
    return { valid: false, error: 'Failed to verify token' };
  }
}

/**
 * Reset user password with token
 */
export async function resetPasswordWithToken(
  token: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First verify the token
    const tokenVerification = await verifyResetToken(token);
    
    if (!tokenVerification.valid || !tokenVerification.user) {
      return { success: false, error: tokenVerification.error || 'Invalid token' };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: tokenVerification.user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

/**
 * Clean up expired reset tokens (should be run periodically)
 */
export async function cleanupExpiredResetTokens(): Promise<number> {
  try {
    const result = await prisma.user.updateMany({
      where: {
        resetTokenExpires: {
          lt: new Date(),
        },
      },
      data: {
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return result.count;
  } catch (error) {
    console.error('Cleanup expired tokens error:', error);
    return 0;
  }
}

/**
 * Get user by reset token (for internal use)
 */
export async function getUserByResetToken(token: string) {
  const hashedToken = hashToken(token);
  
  return await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpires: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}