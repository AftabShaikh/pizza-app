import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/security/rateLimit';

// Rate limiting storage (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function createRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (identifier: string): boolean => {
    const now = Date.now();
    const key = identifier;
    const current = requestCounts.get(key);

    if (!current || now > current.resetTime) {
      // Reset or initialize counter
      requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (current.count >= maxRequests) {
      return false; // Rate limit exceeded
    }

    // Increment counter
    current.count++;
    return true;
  };
}

// Get client identifier for rate limiting
export function getClientIdentifier(request: NextRequest): string {
  // Use IP address as identifier
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}

// Middleware function to apply rate limiting
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  const rateLimiter = createRateLimit(maxRequests, windowMs);

  return async function rateLimitedHandler(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    const identifier = getClientIdentifier(request);
    
    if (!rateLimiter(identifier)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.' 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(windowMs / 1000).toString()
          }
        }
      );
    }

    return handler(request, ...args);
  };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute