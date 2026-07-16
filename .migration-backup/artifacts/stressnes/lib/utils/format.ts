import type { Currency, Money } from '@/types';

/**
 * Format a price amount for display.
 *
 * @example
 * formatPrice(1500) // "EGP 1,500.00"
 * formatPrice(99.9, 'USD') // "USD 99.90"
 */
export function formatPrice(
  amount: number,
  currency: Currency = 'EGP',
  locale = 'en-EG',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a Money object for display.
 */
export function formatMoney(money: Money, locale?: string): string {
  return formatPrice(money.amount, money.currency, locale);
}

/**
 * Format a date for display.
 *
 * @example
 * formatDate(new Date()) // "July 16, 2026"
 * formatDate(new Date(), { dateStyle: 'short' }) // "7/16/26"
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale = 'en-US',
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

/**
 * Format a date as a relative time string.
 *
 * @example
 * formatRelativeDate(new Date(Date.now() - 60000)) // "1 minute ago"
 */
export function formatRelativeDate(date: Date | string | number): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return rtf.format(-diffSeconds, 'second');
  if (diffMinutes < 60) return rtf.format(-diffMinutes, 'minute');
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');
  if (diffDays < 30) return rtf.format(-diffDays, 'day');

  // Fall back to absolute date for older dates
  return formatDate(date);
}
