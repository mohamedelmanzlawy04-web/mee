/**
 * Application-wide constants
 */

/* ── Pagination ──────────────────────────────────────────────── */
export const PAGE_SIZE = 24;
export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;

/* ── Currency ────────────────────────────────────────────────── */
export const DEFAULT_CURRENCY = 'EGP';
export const SUPPORTED_CURRENCIES = ['EGP', 'USD', 'EUR'] as const;

/* ── Order ───────────────────────────────────────────────────── */
export const ORDER_NUMBER_PREFIX = 'STR';
export const MIN_ORDER_AMOUNT = 100; // in smallest currency unit

/* ── Product ─────────────────────────────────────────────────── */
export const MAX_PRODUCT_IMAGES = 10;
export const MAX_PRODUCT_VARIANTS = 50;
export const SKU_PREFIX = 'STR';

/* ── Cart ────────────────────────────────────────────────────── */
export const CART_COOKIE_KEY = 'stressnes_cart';
export const CART_MAX_ITEMS = 100;

/* ── Auth ────────────────────────────────────────────────────── */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
export const BCRYPT_ROUNDS = 12;

/* ── Cache TTL (seconds) ─────────────────────────────────────── */
export const CACHE_TTL = {
  short: 60,          // 1 minute
  medium: 300,        // 5 minutes
  long: 3600,         // 1 hour
  day: 86400,         // 24 hours
} as const;

/* ── Rate Limits (requests per window) ──────────────────────── */
export const RATE_LIMITS = {
  auth: { requests: 5, windowMs: 15 * 60 * 1000 },       // 5 per 15 min
  api: { requests: 100, windowMs: 60 * 1000 },            // 100 per min
  checkout: { requests: 10, windowMs: 60 * 60 * 1000 },  // 10 per hour
} as const;

/* ── Media ───────────────────────────────────────────────────── */
export const IMAGE_QUALITY = 85;
export const THUMBNAIL_SIZE = { width: 400, height: 500 };
export const CARD_SIZE = { width: 600, height: 750 };
export const HERO_SIZE = { width: 1920, height: 1080 };

/* ── Routes ──────────────────────────────────────────────────── */
export const ROUTES = {
  home: '/',
  shop: '/shop',
  product: (slug: string) => `/products/${slug}`,
  cart: '/cart',
  checkout: '/checkout',
  account: '/account',
  orders: '/account/orders',
  wishlist: '/account/wishlist',
  login: '/auth/login',
  register: '/auth/register',
  admin: '/admin',
} as const;
