import csrf from 'csurf';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors/AppError';

// CSRF protection configuration
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
  },
  // Custom error handler
  value: (req: Request) => {
    // Support both header and body token
    return req.headers['x-csrf-token'] as string || 
           req.body._csrf || 
           req.query._csrf as string;
  },
});

// Middleware to add CSRF token to response locals
export const addCsrfToken: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).csrfToken) {
    res.locals.csrfToken = (req as any).csrfToken();
  }
  next();
};

// Custom CSRF error handler
export const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id,
    });
    
    // Custom error response
    return res.status(403).json({
      error: 'Invalid CSRF Token',
      message: 'Form submission failed. Please refresh the page and try again.',
      code: 'CSRF_VALIDATION_FAILED',
    });
  }
  
  // Pass other errors to next handler
  next(err);
};

// Conditional CSRF protection based on content type
export const conditionalCsrf: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for API routes that use JWT
  if (req.path.startsWith('/api/') && req.headers.authorization) {
    return next();
  }
  
  // Skip CSRF for webhook endpoints
  if (req.path.startsWith('/webhook/')) {
    return next();
  }
  
  // Apply CSRF protection
  csrfProtection(req, res, next);
};

// Helper to generate CSRF meta tags for HTML templates
export const generateCsrfMeta = (token: string): string => {
  return `<meta name="csrf-token" content="${token}">`;
};

// Helper to generate CSRF hidden input for forms
export const generateCsrfInput = (token: string): string => {
  return `<input type="hidden" name="_csrf" value="${token}">`;
};

// Middleware to validate CSRF for specific routes
export const requireCsrf = (options?: { 
  cookie?: boolean; 
  sessionKey?: string;
}): RequestHandler => {
  const protection = csrf({
    cookie: options?.cookie !== false ? {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    } : false,
    sessionKey: options?.sessionKey || 'session',
  });
  
  return (req: Request, res: Response, next: NextFunction) => {
    protection(req, res, (err) => {
      if (err) {
        return csrfErrorHandler(err, req, res, next);
      }
      addCsrfToken(req, res, next);
    });
  };
};

export default csrfProtection;
