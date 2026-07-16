import type { NextRequest } from 'next/server';

import { RATE_LIMITS } from '@/constants';

/**
 * Rate Limiting Utilities
 *
 * In-memory rate limiting for Next.js API routes.
 * For production at scale, replace with a Redis-backed solution
 * (e.g., Upstash Redis with @upstash/ratelimit).
 *
 * Note: In-memory limits reset on server restart and don't work
 * across multiple instances. This is suitable for single-instance
 * deployments or as a first layer of defense.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — replace with Redis in production
const store = new Map<string, RateLimitEntry>();

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Check if a request is rate limited.
 * Returns `true` if the request should be blocked.
 *
 * @example
 * const blocked = isRateLimited(request, 'auth');
 * if (blocked) return new Response('Too many requests', { status: 429 });
 */
export function isRateLimited(request: NextRequest, type: RateLimitType): boolean {
  const { requests, windowMs } = RATE_LIMITS[type];
  const ip = getClientIp(request);
  const key = `${type}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= requests) {
    return true;
  }

  entry.count++;
  return false;
}

/**
 * Build a 429 Too Many Requests response.
 */
export function rateLimitResponse(retryAfterSeconds = 60): Response {
  return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfterSeconds),
      'X-RateLimit-Limit': '5',
    },
  });
}

/**
 * Extract the real client IP from request headers.
 * Handles proxies and load balancers.
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

// Periodic cleanup of expired entries (runs on module load)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000); // Clean every 5 minutes
}
