import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema, AUTH_ERRORS } from '@/lib/validation';
import { sendPasswordResetEmail, isRateLimited } from '@/lib/email';
import { generateResetToken } from '@/lib/password-reset';
import { monitoring } from '@/lib/monitoring';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid email address',
          details: validation.error.issues
        }, 
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check rate limiting
    if (isRateLimited(email)) {
      monitoring.trackEvent({
        type: 'user_action',
        name: 'password_reset_rate_limited',
        data: {
          email,
          ip: req.ip || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        }
      });

      return NextResponse.json(
        { error: AUTH_ERRORS.RESET_RATE_LIMIT },
        { status: 429 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true, // Check if user has a password (not just OAuth)
      },
    });

    // Always return success response for security (don't reveal if user exists)
    // But only actually send email if user exists and has a password
    if (user && user.password) {
      try {
        // Generate secure reset token
        const { token, hashedToken } = generateResetToken();
        
        // Set token expiration to 1 hour from now
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        // Update user with reset token
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: hashedToken,
            resetTokenExpires: expiresAt,
          },
        });

        // Send password reset email
        const emailResult = await sendPasswordResetEmail(
          user.email,
          user.name || 'User',
          token
        );

        if (!emailResult.success) {
          monitoring.logError('password_reset_email_failed', emailResult.error, {
            userId: user.id,
            email: user.email,
          });

          return NextResponse.json(
            { error: AUTH_ERRORS.RESET_EMAIL_FAILED },
            { status: 500 }
          );
        }

        monitoring.trackEvent({
          type: 'user_action',
          name: 'password_reset_email_sent',
          data: {
            userId: user.id,
            email: user.email,
            tokenExpiresAt: expiresAt.toISOString(),
          },
          userId: user.id
        });

      } catch (error) {
        monitoring.logError('password_reset_process_failed', error, {
          email,
          userId: user.id,
        });

        return NextResponse.json(
          { error: AUTH_ERRORS.SERVER_ERROR },
          { status: 500 }
        );
      }
    } else {
      // Log attempt for non-existent or OAuth-only users
      monitoring.trackEvent({
        type: 'user_action',
        name: 'password_reset_attempted_invalid_user',
        data: {
          email,
          userExists: !!user,
          hasPassword: user ? !!user.password : false,
        }
      });
    }

    // Always return success message for security
    return NextResponse.json(
      { 
        success: true,
        message: AUTH_ERRORS.RESET_EMAIL_SENT
      },
      { status: 200 }
    );

  } catch (error) {
    monitoring.logError('password_reset_endpoint_error', error, {
      url: req.url,
      method: req.method,
    });

    return NextResponse.json(
      { error: AUTH_ERRORS.SERVER_ERROR },
      { status: 500 }
    );
  }
}