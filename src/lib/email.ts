import { Resend } from 'resend';
import { appLogger } from '@/lib/logger';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'Master-AI <noreply@master-ai.com>';
const APP_NAME = 'Master-AI';
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''), // Strip HTML for text fallback
    });

    return { success: true, data };
  } catch (error) {
    appLogger.error('Email sending failed', { error });
    return { success: false, error };
  }
}

/**
 * Generate password reset email HTML
 */
export function generatePasswordResetEmail(name: string, resetUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - ${APP_NAME}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .content {
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            margin: 20px 0;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .warning {
            background: #fef3cd;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${APP_NAME}</div>
            <h1 class="title">Reset Your Password</h1>
          </div>
          
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            
            <p>We received a request to reset the password for your ${APP_NAME} account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
          </div>
          
          <div class="button-container">
            <a href="${resetUrl}" class="button">Reset My Password</a>
          </div>
          
          <div class="content">
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a></p>
          </div>
          
          <div class="warning">
            <strong>Security Notice:</strong> This reset link will expire in 1 hour for your security. If you didn't request this password reset, please contact our support team.
          </div>
          
          <div class="footer">
            <p>This email was sent by ${APP_NAME}</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Reset Your Password - ${APP_NAME}
    
    Hi ${name || 'there'},
    
    We received a request to reset the password for your ${APP_NAME} account. If you didn't make this request, you can safely ignore this email.
    
    To reset your password, visit this link:
    ${resetUrl}
    
    This reset link will expire in 1 hour for your security.
    
    If you didn't request this password reset, please contact our support team.
    
    Best regards,
    The ${APP_NAME} Team
  `;

  return { html, text };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${resetToken}`;
  const { html, text } = generatePasswordResetEmail(name, resetUrl);

  return await sendEmail({
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html,
    text,
  });
}

/**
 * Rate limiting for password reset emails
 * Simple in-memory cache - in production, use Redis or database
 */
const resetEmailCache = new Map<string, number>();

export function isRateLimited(email: string): boolean {
  const now = Date.now();
  const lastRequest = resetEmailCache.get(email);
  
  // Allow one reset email per 5 minutes
  if (lastRequest && now - lastRequest < 5 * 60 * 1000) {
    return true;
  }
  
  resetEmailCache.set(email, now);
  
  // Clean up old entries every hour
  if (resetEmailCache.size > 1000) {
    resetEmailCache.clear();
  }
  
  return false;
}