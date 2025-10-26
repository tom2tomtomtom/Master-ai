/**
 * Security Headers Middleware for Next.js
 * Implements Helmet.js-style security headers
 */

import { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    directives?: Record<string, string[]>;
    reportOnly?: boolean;
  };
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  noSniff?: boolean;
  frameguard?: {
    action?: 'deny' | 'sameorigin' | 'allow-from';
    domain?: string;
  };
  xssFilter?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: Record<string, string[]>;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin';
  dnsPrefetchControl?: boolean;
  expectCt?: {
    maxAge?: number;
    enforce?: boolean;
    reportUri?: string;
  };
}

const DEFAULT_CONFIG: Required<SecurityHeadersConfig> = {
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://api.stripe.com'],
      'frame-src': ["'self'", 'https://js.stripe.com'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
    },
    reportOnly: false,
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: {
    action: 'deny',
    domain: undefined,
  },
  xssFilter: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    'camera': [],
    'microphone': [],
    'geolocation': [],
    'interest-cohort': [], // Disable FLoC
  },
  crossOriginEmbedderPolicy: false, // Can break some integrations
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: 'same-origin',
  dnsPrefetchControl: true,
  expectCt: {
    maxAge: 86400, // 24 hours
    enforce: false,
    reportUri: undefined,
  },
};

/**
 * Create CSP directive string
 */
function createCSPDirective(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Create Permissions Policy string
 */
function createPermissionsPolicy(permissions: Record<string, string[]>): string {
  return Object.entries(permissions)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return `${directive}=()`;
      }
      return `${directive}=(${values.map(v => `"${v}"`).join(' ')})`;
    })
    .join(', ');
}

/**
 * Create security headers middleware
 */
export function createSecurityHeaders(config: SecurityHeadersConfig = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config } as Required<SecurityHeadersConfig>;

  return function securityHeadersMiddleware(
    request: NextRequest,
    response: NextResponse
  ): NextResponse {
    const newResponse = response || NextResponse.next();
    const isProduction = process.env.NODE_ENV === 'production';

    // Content Security Policy
    if (fullConfig.contentSecurityPolicy && fullConfig.contentSecurityPolicy.directives) {
      const cspValue = createCSPDirective(fullConfig.contentSecurityPolicy.directives);
      const headerName = fullConfig.contentSecurityPolicy.reportOnly 
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';
      
      newResponse.headers.set(headerName, cspValue);
    }

    // HTTP Strict Transport Security (only in production with HTTPS)
    if (isProduction && fullConfig.hsts) {
      let hstsValue = `max-age=${fullConfig.hsts.maxAge}`;
      if (fullConfig.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (fullConfig.hsts.preload) {
        hstsValue += '; preload';
      }
      newResponse.headers.set('Strict-Transport-Security', hstsValue);
    }

    // X-Content-Type-Options
    if (fullConfig.noSniff) {
      newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // X-Frame-Options
    if (fullConfig.frameguard && fullConfig.frameguard.action) {
      let frameValue = fullConfig.frameguard.action.toUpperCase();
      if (frameValue === 'ALLOW-FROM' && fullConfig.frameguard.domain) {
        frameValue += ` ${fullConfig.frameguard.domain}`;
      }
      newResponse.headers.set('X-Frame-Options', frameValue);
    }

    // X-XSS-Protection (legacy, but still useful)
    if (fullConfig.xssFilter) {
      newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    }

    // Referrer Policy
    if (fullConfig.referrerPolicy) {
      newResponse.headers.set('Referrer-Policy', fullConfig.referrerPolicy);
    }

    // Permissions Policy
    if (fullConfig.permissionsPolicy) {
      const permissionsValue = createPermissionsPolicy(fullConfig.permissionsPolicy);
      newResponse.headers.set('Permissions-Policy', permissionsValue);
    }

    // Cross-Origin Embedder Policy
    if (fullConfig.crossOriginEmbedderPolicy) {
      newResponse.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    }

    // Cross-Origin Opener Policy
    if (fullConfig.crossOriginOpenerPolicy) {
      newResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    }

    // Cross-Origin Resource Policy
    if (fullConfig.crossOriginResourcePolicy) {
      newResponse.headers.set('Cross-Origin-Resource-Policy', fullConfig.crossOriginResourcePolicy);
    }

    // X-DNS-Prefetch-Control
    if (fullConfig.dnsPrefetchControl) {
      newResponse.headers.set('X-DNS-Prefetch-Control', 'off');
    }

    // Expect-CT (deprecated but still useful)
    if (fullConfig.expectCt && isProduction) {
      let expectCtValue = `max-age=${fullConfig.expectCt.maxAge}`;
      if (fullConfig.expectCt.enforce) {
        expectCtValue += ', enforce';
      }
      if (fullConfig.expectCt.reportUri) {
        expectCtValue += `, report-uri="${fullConfig.expectCt.reportUri}"`;
      }
      newResponse.headers.set('Expect-CT', expectCtValue);
    }

    // Remove server information
    newResponse.headers.set('Server', 'Master-AI');

    return newResponse;
  };
}

/**
 * Pre-configured security headers for different environments
 */
export const securityHeaders = {
  // Development - relaxed CSP for easier debugging
  development: createSecurityHeaders({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:*', 'https://js.stripe.com'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:', 'localhost:*'],
        'connect-src': ["'self'", 'localhost:*', 'ws://localhost:*', 'https://api.stripe.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'frame-src': ["'self'", 'https://js.stripe.com'],
      },
      reportOnly: false,
    },
    hsts: {
      maxAge: 0, // Disable HSTS in development
      includeSubDomains: false,
      preload: false,
    },
  }),

  // Production - strict security
  production: createSecurityHeaders({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://js.stripe.com', 'https://www.googletagmanager.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", 'https://api.stripe.com', 'https://www.google-analytics.com'],
        'frame-src': ["'self'", 'https://js.stripe.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': [],
      },
      reportOnly: false,
    },
  }),

  // API-only - minimal headers for API routes
  api: createSecurityHeaders({
    contentSecurityPolicy: undefined, // Not needed for API-only responses
    frameguard: { action: 'deny' },
    noSniff: true,
    crossOriginResourcePolicy: 'same-origin',
  }),
};

/**
 * Environment-aware security headers
 */
export const getSecurityHeaders = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return securityHeaders.production;
  }
  
  return securityHeaders.development;
};

/**
 * Default security headers instance
 */
export const defaultSecurityHeaders = getSecurityHeaders();