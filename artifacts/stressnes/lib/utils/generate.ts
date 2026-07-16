import { ORDER_NUMBER_PREFIX, SKU_PREFIX } from '@/constants';

/**
 * Generate a unique SKU for a product variant.
 * Format: STR-{CATEGORY}-{RANDOM}
 *
 * @example
 * generateSKU('TOP') // "STR-TOP-A3K9X"
 */
export function generateSKU(category = 'GEN'): string {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${SKU_PREFIX}-${category.toUpperCase().slice(0, 4)}-${random}`;
}

/**
 * Generate a human-readable order number.
 * Format: STR-{YEAR}{MONTH}-{RANDOM}
 *
 * @example
 * generateOrderNumber() // "STR-202607-X4J2K"
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${ORDER_NUMBER_PREFIX}-${year}${month}-${random}`;
}

/**
 * Generate a cryptographically random token (for invites, reset tokens, etc.)
 * Falls back to Math.random if crypto is unavailable.
 *
 * @param length - Number of bytes (output is 2x in hex)
 */
export function generateToken(length = 32): string {
  if (typeof globalThis.crypto !== 'undefined') {
    const array = new Uint8Array(length);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback (non-cryptographic)
  return Array.from({ length: length * 2 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
}
