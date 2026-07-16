import { CACHE_TTL } from '@/constants';

/**
 * Next.js caching utilities
 * Wrappers around Next.js fetch cache semantics and revalidation tags.
 */

/**
 * Build a standard Next.js fetch options object with cache control.
 *
 * @example
 * const data = await fetch(url, withCache('products', CACHE_TTL.long));
 */
export function withCache(
  tags: string | string[],
  revalidate: number = CACHE_TTL.medium,
): RequestInit {
  return {
    next: {
      revalidate,
      tags: Array.isArray(tags) ? tags : [tags],
    },
  };
}

/**
 * Build fetch options that bypass the cache (always fresh).
 */
export function noCache(): RequestInit {
  return { cache: 'no-store' };
}

/**
 * Standard cache tags used throughout the app.
 * Import these instead of inline strings to avoid typos.
 */
export const CacheTags = {
  products: 'products',
  product: (id: string) => `product:${id}`,
  categories: 'categories',
  orders: 'orders',
  order: (id: string) => `order:${id}`,
  cart: (id: string) => `cart:${id}`,
  user: (id: string) => `user:${id}`,
} as const;

/**
 * In-memory memoization for expensive computations within a single request.
 * NOT shared across requests — use Next.js cache() for cross-request sharing.
 */
export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();
  return (...args: TArgs): TReturn => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key) as TReturn;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
