/**
 * Convert a string to a URL-safe slug.
 *
 * @example
 * slugify('Luxury Silk Blouse') // "luxury-silk-blouse"
 * slugify('100% Cotton — Premium') // "100-cotton-premium"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace accented characters
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace non-alphanumeric characters (keep hyphens and spaces)
    .replace(/[^\w\s-]/g, '')
    // Replace multiple spaces or hyphens with a single hyphen
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert a slug back to a readable title.
 *
 * @example
 * deslugify('luxury-silk-blouse') // "Luxury Silk Blouse"
 */
export function deslugify(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
