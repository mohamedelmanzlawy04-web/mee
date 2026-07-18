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
    instagram: 'https://www.instagram.com/stressnes.co?igsh=MXMwdnp6cjR6OTUyZA==',
    tiktok: 'https://www.tiktok.com/@stressnes7?_r=1&_t=ZS-9890gaBpyXF',
  },
  support: {
    email: 'support@stressnes.com',
  },
} as const;

export type SiteConfig = typeof siteConfig;
