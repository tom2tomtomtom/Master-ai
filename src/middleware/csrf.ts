/**
 * CSRF Protection for Next.js API Routes
 * Implements token-based CSRF protection with double-submit cookie pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export interface CSRFConfig {
  secret?: string;
  saltLength?: number;
  tokenLength?: number;
  cookieName?: string;
  headerName?: string;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
  maxAge?: number;
  ignoreMethods?: string[];
  skipRoutes?: string[];
}

const DEFAULT_CONFIG: Required<CSRFConfig> = {
  secret: process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'default-csrf-secret',
  saltLength: 8,
  tokenLength: 18,
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  httpOnly: false, // Must be false for client-side access
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 3600, // 1 hour
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  skipRoutes: ['/api/auth/', '/api/health'],
};

/**
 * Generate CSRF token
 */
function generateToken(secret: string, saltLength: number, tokenLength: number): string {
  const salt = crypto.randomBytes(saltLength).toString('hex');
  const hash = crypto.createHmac('sha256', secret)
    .update(salt)
    .digest('hex')
    .substring(0, tokenLength);
  
  return `${salt}-${hash}`;
}

/**
 * Verify CSRF token
 */
function verifyToken(token: string, secret: string, tokenLength: number): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('-');
  if (parts.length !== 2) {
    return false;
  }

  const [salt, hash] = parts;
  const expectedHash = crypto.createHmac('sha256', secret)
    .update(salt)
    .digest('hex')
    .substring(0, tokenLength);

  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
}

/**
 * Create CSRF protection middleware
 */
export function createCSRFProtection(config: CSRFConfig = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  return async function csrfMiddleware(
    request: NextRequest,
    response: NextResponse
  ): Promise<NextResponse | null> {
    // Skip if CSRF protection is disabled
    if (process.env.ENABLE_CSRF_PROTECTION === 'false') {
      return null;
    }

    const method = request.method;
    const pathname = request.nextUrl.pathname;

    // Skip for ignored methods
    if (fullConfig.ignoreMethods.includes(method)) {
      return null;
    }

    // Skip for specific routes
    if (fullConfig.skipRoutes.some(route => pathname.startsWith(route))) {
      return null;
    }

    const cookieToken = request.cookies.get(fullConfig.cookieName)?.value;
    const headerToken = request.headers.get(fullConfig.headerName);
    
    // For safe methods, just set the token if it doesn't exist
    if (method === 'GET' || method === 'HEAD') {
      if (!cookieToken) {
        const newToken = generateToken(
          fullConfig.secret,
          fullConfig.saltLength,
          fullConfig.tokenLength
        );
        
        const newResponse = response || NextResponse.next();
        newResponse.cookies.set(fullConfig.cookieName, newToken, {
          httpOnly: fullConfig.httpOnly,
          secure: fullConfig.secure,
          sameSite: fullConfig.sameSite,
          maxAge: fullConfig.maxAge,
          path: '/',
        });
        
        return newResponse;
      }
      return null;
    }

    // For state-changing methods, verify the token
    if (!cookieToken) {
      return new NextResponse(
        JSON.stringify({
          error: 'CSRF token missing. Please refresh the page.',
          code: 'CSRF_TOKEN_MISSING',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check header token
    if (!headerToken) {
      return new NextResponse(
        JSON.stringify({
          error: 'CSRF token not provided in headers.',
          code: 'CSRF_HEADER_MISSING',
          hint: 'Include X-CSRF-Token header with your request',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Verify tokens match
    if (cookieToken !== headerToken) {
      return new NextResponse(
        JSON.stringify({
          error: 'CSRF token mismatch.',
          code: 'CSRF_TOKEN_MISMATCH',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Verify token is valid
    if (!verifyToken(cookieToken, fullConfig.secret, fullConfig.tokenLength)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid CSRF token.',
          code: 'CSRF_TOKEN_INVALID',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return null; // Token is valid, continue
  };
}

/**
 * Get CSRF token from cookies (for client-side use)
 */
export function getCSRFToken(request: NextRequest): string | null {
  return request.cookies.get(DEFAULT_CONFIG.cookieName)?.value || null;
}

/**
 * API endpoint to get CSRF token
 */
export async function handleCSRFToken(request: NextRequest): Promise<NextResponse> {
  const token = generateToken(
    DEFAULT_CONFIG.secret,
    DEFAULT_CONFIG.saltLength,
    DEFAULT_CONFIG.tokenLength
  );

  const response = NextResponse.json({ csrfToken: token });
  
  response.cookies.set(DEFAULT_CONFIG.cookieName, token, {
    httpOnly: DEFAULT_CONFIG.httpOnly,
    secure: DEFAULT_CONFIG.secure,
    sameSite: DEFAULT_CONFIG.sameSite,
    maxAge: DEFAULT_CONFIG.maxAge,
    path: '/',
  });

  return response;
}

/**
 * Default CSRF protection instance
 */
export const csrfProtection = createCSRFProtection();

/**
 * Client-side helper to get CSRF token from cookies
 */
export const getClientCSRFToken = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const name = DEFAULT_CONFIG.cookieName + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  
  return null;
};

/**
 * Fetch wrapper that automatically includes CSRF token
 */
export const csrfFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getClientCSRFToken();
  
  const headers = new Headers(options.headers);
  if (token && !headers.has(DEFAULT_CONFIG.headerName)) {
    headers.set(DEFAULT_CONFIG.headerName, token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};