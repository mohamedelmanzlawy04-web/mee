import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a price (stored as integer cents or float dollars depending on API) */
export function formatPrice(amount: number, currency = 'EGP'): string {
  // API stores prices as floats (e.g. 1500.00 = 1500 EGP)
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/** Get the primary image URL for a product, falling back to a placeholder */
export function getProductImage(images?: Array<{ url: string; isPrimary?: boolean }>, index = 0): string {
  if (!images || images.length === 0) {
    return `https://picsum.photos/seed/product-${index}/600/800`;
  }
  const primary = images.find((img) => img.isPrimary);
  return primary?.url ?? images[0]?.url ?? `https://picsum.photos/seed/product-${index}/600/800`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}
