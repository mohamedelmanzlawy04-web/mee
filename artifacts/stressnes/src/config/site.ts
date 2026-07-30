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
    instagram: 'https://www.instagram.com/stressnes.offical?igsh=MWZiZ2NlcWNoM2hiZw==',
    tiktok: 'https://www.tiktok.com/@stressnes_offical?_r=1&_t=ZS-98TUe6kT7iO',
  },
  payment: {
    instapayLink: 'https://ipn.eg/S/mohamed.abdo076090/instapay/2krEyL',
    instapayAccountName: 'mohamed a....',
  },
  support: {
    email: 'support@stressnes.com',
  },
} as const;

export type SiteConfig = typeof siteConfig;
