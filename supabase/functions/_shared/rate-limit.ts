// Simple in-memory rate limiting for edge functions
// Note: This is per-instance and resets on cold starts.
// For production, consider using Supabase or external storage.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (per function instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  maxRequests: number;     // Maximum requests allowed
  windowMs: number;        // Time window in milliseconds
  keyPrefix?: string;      // Prefix for the key (e.g., function name)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Extract a rate limit key from the request (IP or forwarded IP)
 */
export function getRateLimitKey(req: Request, prefix: string = ''): string {
  // Try to get real IP from various headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown';
  
  return `${prefix}:${ip}`;
}

/**
 * Check and update rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();
  
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create a rate limit response for rejected requests
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}

// Stricter rate limits for unauthenticated users
export const RATE_LIMITS_UNAUTHENTICATED = {
  // AI generation functions - very strict for anonymous users
  aiGeneration: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 requests per minute (was 30)
  },
  // TTS/STT - expensive external API, strict limits
  speech: {
    maxRequests: 3,
    windowMs: 60 * 1000, // 3 requests per minute (was 20)
  },
  // Analytics - moderate limits
  analytics: {
    maxRequests: 15,
    windowMs: 60 * 1000, // 15 requests per minute (was 60)
  },
  // Document parsing - strict for anonymous
  documentParsing: {
    maxRequests: 3,
    windowMs: 60 * 1000, // 3 requests per minute
  },
  // Interrogation - AI-intensive, very strict
  interrogation: {
    maxRequests: 2,
    windowMs: 60 * 1000, // 2 requests per minute
  },
} as const;

// More generous rate limits for authenticated users
export const RATE_LIMITS_AUTHENTICATED = {
  // AI generation functions - generous for logged-in users
  aiGeneration: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 60 requests per minute
  },
  // TTS/STT - generous for logged-in users
  speech: {
    maxRequests: 40,
    windowMs: 60 * 1000, // 40 requests per minute
  },
  // Analytics - very generous
  analytics: {
    maxRequests: 120,
    windowMs: 60 * 1000, // 120 requests per minute
  },
  // Document parsing - generous for authenticated
  documentParsing: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 requests per minute
  },
  // Interrogation - generous for authenticated
  interrogation: {
    maxRequests: 15,
    windowMs: 60 * 1000, // 15 requests per minute
  },
} as const;

// Legacy export for backwards compatibility
export const RATE_LIMITS = RATE_LIMITS_UNAUTHENTICATED;

/**
 * Get rate limit config based on authentication status
 */
export function getRateLimitConfig(
  type: keyof typeof RATE_LIMITS_AUTHENTICATED,
  isAuthenticated: boolean
): RateLimitConfig {
  return isAuthenticated
    ? RATE_LIMITS_AUTHENTICATED[type]
    : RATE_LIMITS_UNAUTHENTICATED[type];
}
