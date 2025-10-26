import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Content Security Policy configuration
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Consider removing in production
      "'unsafe-eval'", // Consider removing in production
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
    ],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    connectSrc: ["'self'", 'wss:', 'https:'],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'self'"],
    childSrc: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'", 'blob:'],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
  },
  reportOnly: process.env.NODE_ENV === 'development',
};

// Create secure headers middleware
export const secureHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? cspConfig : false,
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Expect-CT
  expectCt: {
    enforce: true,
    maxAge: 30,
  },
  
  // Frameguard (X-Frame-Options)
  frameguard: { action: 'deny' },
  
  // Hide Powered By
  hidePoweredBy: true,
  
  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permitted Cross Domain Policies
  permittedCrossDomainPolicies: false,
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // XSS Filter
  xssFilter: true,
});

// Additional security headers not covered by Helmet
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Feature Policy / Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // Clear Site Data (for logout endpoints)
  if (req.path === '/logout' || req.path === '/api/auth/logout') {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }
  
  // Cache Control for sensitive pages
  if (req.path.includes('/admin') || req.path.includes('/account')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

// CORS configuration for API endpoints
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
};

// Security headers middleware composer
export const setupSecurityHeaders = () => {
  return [
    secureHeaders,
    additionalSecurityHeaders,
  ];
};
