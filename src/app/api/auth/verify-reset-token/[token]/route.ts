import { NextRequest, NextResponse } from 'next/server';
import { verifyResetToken } from '@/lib/password-reset';
import { AUTH_ERRORS } from '@/lib/validation';
import { monitoring } from '@/lib/monitoring';

interface RouteContext {
  params: {
    token: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Reset token is required'
        },
        { status: 400 }
      );
    }

    // Verify the reset token
    const verification = await verifyResetToken(token);

    if (!verification.valid) {
      monitoring.trackEvent({
        type: 'user_action',
        name: 'password_reset_token_verification_failed',
        data: {
          token: token.substring(0, 8) + '...', // Log partial token for debugging
          error: verification.error,
          ip: req.ip || 'unknown',
        }
      });

      return NextResponse.json(
        {
          valid: false,
          error: verification.error || AUTH_ERRORS.RESET_TOKEN_INVALID
        },
        { status: 400 }
      );
    }

    monitoring.trackEvent({
      type: 'user_action',
      name: 'password_reset_token_verified',
      data: {
        userId: verification.user?.id,
        email: verification.user?.email,
      },
      userId: verification.user?.id
    });

    return NextResponse.json(
      {
        valid: true,
        user: {
          email: verification.user?.email,
          name: verification.user?.name,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    monitoring.logError('verify_reset_token_endpoint_error', error, {
      token: params.token ? params.token.substring(0, 8) + '...' : 'none',
      url: req.url,
      method: req.method,
    });

    return NextResponse.json(
      {
        valid: false,
        error: AUTH_ERRORS.SERVER_ERROR
      },
      { status: 500 }
    );
  }
}