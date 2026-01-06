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

// Default rate limit configs for different function types
export const RATE_LIMITS = {
  // AI generation functions - more expensive
  aiGeneration: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 requests per minute
  },
  // TTS/STT - expensive external API
  speech: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 requests per minute
  },
  // Analytics - less expensive
  analytics: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 60 requests per minute
  },
} as const;
