/* ── Pagination ──────────────────────────────────────────────── */
export const PAGE_SIZE = 24;
export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;

/* ── Currency ────────────────────────────────────────────────── */
export const DEFAULT_CURRENCY = 'EGP';
export const SUPPORTED_CURRENCIES = ['EGP', 'USD', 'EUR'] as const;

/* ── Order ───────────────────────────────────────────────────── */
export const ORDER_NUMBER_PREFIX = 'STR';
export const MIN_ORDER_AMOUNT = 100;

/* ── Product ─────────────────────────────────────────────────── */
export const MAX_PRODUCT_IMAGES = 10;
export const MAX_PRODUCT_VARIANTS = 50;
export const SKU_PREFIX = 'STR';

/* ── Cart ────────────────────────────────────────────────────── */
export const CART_COOKIE_KEY = 'stressnes_cart';
export const CART_MAX_ITEMS = 100;

/* ── Auth ────────────────────────────────────────────────────── */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
export const BCRYPT_ROUNDS = 12;

/* ── Cache TTL (seconds) ─────────────────────────────────────── */
export const CACHE_TTL = {
  short: 60,
  medium: 300,
  long: 3600,
  day: 86400,
} as const;

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
