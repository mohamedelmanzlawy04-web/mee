/**
 * Image optimization utilities
 * Helpers for Next.js Image component, Cloudinary transforms, and lazy loading.
 */

/**
 * Build a Cloudinary transformation URL.
 *
 * @example
 * cloudinaryUrl('products/shirt.jpg', { width: 600, height: 750, quality: 85 })
 */
export interface CloudinaryTransform {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'pad';
  gravity?: 'auto' | 'face' | 'center';
  blur?: number;
}

export function cloudinaryUrl(
  publicId: string,
  transform: CloudinaryTransform = {},
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  if (!cloudName) return '';

  const {
    width,
    height,
    quality = 85,
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
    blur,
  } = transform;

  const parts: string[] = [];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (crop) parts.push(`c_${crop}`);
  if (gravity) parts.push(`g_${gravity}`);
  if (quality) parts.push(`q_${quality}`);
  if (format) parts.push(`f_${format}`);
  if (blur) parts.push(`e_blur:${blur}`);

  const transformString = parts.join(',');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
}

/**
 * Generate responsive sizes attribute for Next.js Image.
 * Returns sensible defaults for common layout patterns.
 */
export function responsiveSizes(layout: 'full' | 'half' | 'third' | 'card' | 'thumb'): string {
  const map: Record<string, string> = {
    full: '100vw',
    half: '(max-width: 768px) 100vw, 50vw',
    third: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
    thumb: '80px',
  };
  return map[layout] ?? '100vw';
}

/**
 * Generate a blur data URL placeholder for images.
 * Returns a tiny SVG that acts as a blur-up placeholder.
 */
export function blurDataUrl(color = '#f5f5f5'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="5">
    <rect width="4" height="5" fill="${color}"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
