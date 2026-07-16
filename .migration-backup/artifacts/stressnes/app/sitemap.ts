import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site';

/**
 * Dynamic Sitemap
 *
 * Next.js generates sitemap.xml at /sitemap.xml automatically.
 * Add dynamic product/category URLs when the database is seeded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
