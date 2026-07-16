/**
 * Site-wide configuration
 * Single source of truth for brand metadata, URLs, and SEO defaults.
 */
export const siteConfig = {
  name: 'STRESSNES',
  description: 'Luxury fashion ecommerce. Curated pieces for the discerning wardrobe.',
  url: import.meta.env.VITE_APP_URL ?? 'https://stressnes.com',
  keywords: ['luxury fashion', 'designer clothing', 'premium apparel', 'high-end fashion', 'STRESSNES'],
  social: {
    instagram: 'https://instagram.com/stressnes',
    twitter: 'https://twitter.com/stressnes',
  },
  support: {
    email: 'support@stressnes.com',
  },
} as const;

export type SiteConfig = typeof siteConfig;
