/**
 * Site-wide configuration
 * Single source of truth for brand metadata, URLs, and SEO defaults.
 */
export const siteConfig = {
  name: 'STRESSNES',
  description:
    'Luxury fashion ecommerce. Curated pieces for the discerning wardrobe.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  keywords: [
    'luxury fashion',
    'designer clothing',
    'premium apparel',
    'high-end fashion',
    'STRESSNES',
  ],
  social: {
    instagram: 'https://instagram.com/stressnes',
    twitter: 'https://twitter.com/stressnes',
  },
  support: {
    email: 'support@stressnes.com',
  },
} as const;

export type SiteConfig = typeof siteConfig;
