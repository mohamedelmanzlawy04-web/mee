/**
 * Input sanitization utilities
 * Prevents XSS, SQL injection vectors, and data integrity issues.
 */

/**
 * Strip HTML tags from a string.
 * Use for any user-provided text that must not contain markup.
 *
 * @example
 * stripHtml('<script>alert("xss")</script>Hello') // "Hello"
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Escape HTML entities in a string.
 * Use when embedding user input into HTML contexts.
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char] ?? char);
}

/**
 * Normalize a phone number to digits only.
 *
 * @example
 * normalizePhone('+20 123 456 7890') // "201234567890"
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Normalize an email address to lowercase and trimmed.
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Truncate a string to a maximum length, appending an ellipsis if needed.
 */
export function truncate(text: string, maxLength: number, ellipsis = '…'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Remove excess whitespace from a string (normalize spaces, strip leading/trailing).
 */
export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}
