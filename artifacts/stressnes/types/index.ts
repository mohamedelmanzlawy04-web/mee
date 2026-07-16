/**
 * Global TypeScript type definitions for STRESSNES
 *
 * Domain types, utility types, and shared interfaces.
 * Prisma-generated types live in @prisma/client.
 */

/* ── Utility Types ───────────────────────────────────────────── */

/** Make specific keys of T optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific keys of T required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Deep partial */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Paginated API response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Standard API error shape */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/** Standard API success response */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/* ── Currency ────────────────────────────────────────────────── */
export type Currency = 'EGP' | 'USD' | 'EUR';

export interface Money {
  amount: number;
  currency: Currency;
}

/* ── Address ─────────────────────────────────────────────────── */
export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/* ── Product ─────────────────────────────────────────────────── */
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ProductImage {
  url: string;
  alt: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

/* ── Order ───────────────────────────────────────────────────── */
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentProvider = 'PAYMOB' | 'STRIPE';

/* ── Shipping ────────────────────────────────────────────────── */
export type ShippingProvider = 'BOSTA' | 'MANUAL';

export interface ShippingRate {
  id: string;
  name: string;
  price: Money;
  estimatedDays: number;
  provider: ShippingProvider;
}

/* ── Cart ────────────────────────────────────────────────────── */
export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: Money;
  name: string;
  sku: string;
  image: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: Money;
  discount?: Money;
  shipping?: Money;
  tax?: Money;
  total: Money;
}

/* ── User / Auth ─────────────────────────────────────────────── */
export type UserRole = 'CUSTOMER' | 'ADMIN' | 'STAFF';

/* ── Navigation ──────────────────────────────────────────────── */
export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  children?: NavItem[];
}

/* ── Filter / Sort ───────────────────────────────────────────── */
export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  label: string;
  value: string;
  field: string;
  order: SortOrder;
}
