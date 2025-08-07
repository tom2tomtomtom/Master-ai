import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema, AUTH_ERRORS, validatePasswordStrength } from '@/lib/validation';
import { resetPasswordWithToken } from '@/lib/password-reset';
import { monitoring } from '@/lib/monitoring';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        }, 
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Additional password strength validation
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isStrong) {
      return NextResponse.json(
        { 
          error: AUTH_ERRORS.WEAK_PASSWORD,
          passwordStrength: {
            score: passwordStrength.score,
            label: passwordStrength.label,
            checks: passwordStrength.checks
          }
        },
        { status: 400 }
      );
    }

    // Reset the password
    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      monitoring.trackEvent({
        type: 'user_action',
        name: 'password_reset_failed',
        data: {
          token: token.substring(0, 8) + '...', // Log partial token for debugging
          error: result.error,
          ip: req.ip || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        }
      });

      // Determine appropriate error message
      let errorMessage: string = AUTH_ERRORS.RESET_TOKEN_INVALID;
      if (result.error?.includes('expired')) {
        errorMessage = AUTH_ERRORS.RESET_TOKEN_EXPIRED;
      } else if (result.error?.includes('used')) {
        errorMessage = AUTH_ERRORS.RESET_TOKEN_USED;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    monitoring.trackEvent({
      type: 'user_action',
      name: 'password_reset_successful',
      data: {
        token: token.substring(0, 8) + '...', // Log partial token for debugging
        ip: req.ip || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      }
    });

    return NextResponse.json(
      { 
        success: true,
        message: AUTH_ERRORS.PASSWORD_RESET_SUCCESS
      },
      { status: 200 }
    );

  } catch (error) {
    monitoring.logError('reset_password_endpoint_error', error, {
      url: req.url,
      method: req.method,
    });

    return NextResponse.json(
      { error: AUTH_ERRORS.SERVER_ERROR },
      { status: 500 }
    );
  }
}