/**
 * Request ID Tracking Middleware
 * Adds unique request IDs for tracing and debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Extract or generate request ID
 */
function getOrCreateRequestId(request: NextRequest): string {
  // Check if request already has ID
  const existingId = request.headers.get('x-request-id');
  if (existingId) {
    return existingId;
  }

  // Generate new ID
  return generateRequestId();
}

/**
 * Request ID middleware
 */
export function requestIdMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const requestId = getOrCreateRequestId(request);
  
  // Create new response with request ID header
  const newResponse = response || NextResponse.next();
  newResponse.headers.set('X-Request-ID', requestId);
  
  // Also set in request headers for downstream use
  request.headers.set('x-request-id', requestId);
  
  return newResponse;
}

/**
 * Get request ID from request
 */
export function getRequestId(request: NextRequest): string {
  return request.headers.get('x-request-id') || generateRequestId();
}

/**
 * Add request ID to response
 */
export function addRequestIdToResponse(
  response: NextResponse,
  requestId: string
): NextResponse {
  response.headers.set('X-Request-ID', requestId);
  return response;
}