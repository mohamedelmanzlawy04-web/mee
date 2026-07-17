/**
 * Static product data — displayed when the database is not yet connected.
 * Once the API server has a live database and the product is seeded, the API
 * response takes priority and this data is unused.
 *
 * Shape matches the Product type from @workspace/api-client-react.
 */

export const LOBSTER_TEE = {
  id: 'static-lobster-tee',
  title: 'Lobster Tee',
  slug: 'lobster-tee',
  sku: 'STRS-LBST-001',
  shortDescription: 'BOXY FIT',
  description:
    "The STRESSNES Lobster Tee is the debut Summer '26 statement piece. Crafted from 320 gsm heavyweight cotton in a relaxed oversized silhouette, it bears a hand-illustrated lobster graphic in coral-red and ocean-blue — screen-printed on the back. Limited run.",
  price: 1600,
  comparePrice: 2000,
  status: 'ACTIVE' as const,
  featured: true,
  published: true,
  category: {
    id: 'static-tshirts',
    name: 'T-Shirts',
    slug: 't-shirts',
  },
  images: [
    {
      id: 'img-1',
      url: '/images/lobster-tee-1.jpeg',
      altText: 'STRESSNES Lobster Tee — flat lay on coastal rocks',
      sortOrder: 0,
      isPrimary: true,
    },
    {
      id: 'img-2',
      url: '/images/lobster-tee-2.jpeg',
      altText: 'STRESSNES Lobster Tee — worn on the beach, back graphic',
      sortOrder: 1,
      isPrimary: false,
    },
    {
      id: 'img-3',
      url: '/images/lobster-tee-3.jpeg',
      altText: 'STRESSNES Lobster Tee — held at the seaside, lifestyle shot',
      sortOrder: 2,
      isPrimary: false,
    },
  ],
  variants: [
    { id: 'var-m',  sku: 'STRS-LBST-001-M',  size: 'M',  isActive: true, stockQty: 25 },
    { id: 'var-l',  sku: 'STRS-LBST-001-L',  size: 'L',  isActive: true, stockQty: 25 },
    { id: 'var-xl', sku: 'STRS-LBST-001-XL', size: 'XL', isActive: true, stockQty: 25 },
  ],
  createdAt: new Date('2026-07-01').toISOString(),
  updatedAt: new Date('2026-07-01').toISOString(),
};

export const SEA_CALLS_ME_TEE = {
  id: 'static-sea-calls-me-tee',
  title: 'Sea Calls Me Tee',
  slug: 'sea-calls-me-tee',
  sku: 'STRS-SCMT-001',
  shortDescription: 'BOXY FIT',
  description:
    "The STRESSNES Sea Calls Me Tee is the second Summer '26 drop. Crafted from 320 gsm heavyweight cotton in a relaxed oversized silhouette, it features a hand-illustrated seashell motif with the phrase 'Saltwater Heals Everything' screen-printed on the back. Limited run.",
  price: 1600,
  comparePrice: 2000,
  status: 'ACTIVE' as const,
  featured: true,
  published: true,
  category: {
    id: 'static-tshirts',
    name: 'T-Shirts',
    slug: 't-shirts',
  },
  images: [
    {
      id: 'scmt-img-1',
      url: '/images/sea-calls-me-1.jpeg',
      altText: 'STRESSNES Sea Calls Me Tee — flat lay on beach sand',
      sortOrder: 0,
      isPrimary: true,
    },
    {
      id: 'scmt-img-2',
      url: '/images/sea-calls-me-2.jpeg',
      altText: 'STRESSNES Sea Calls Me Tee — back graphic detail, worn seaside',
      sortOrder: 1,
      isPrimary: false,
    },
    {
      id: 'scmt-img-3',
      url: '/images/sea-calls-me-3.jpeg',
      altText: 'STRESSNES Sea Calls Me Tee — full back lifestyle shot on the shore',
      sortOrder: 2,
      isPrimary: false,
    },
  ],
  variants: [
    { id: 'scmt-var-m',  sku: 'STRS-SCMT-001-M',  size: 'M',  isActive: true, stockQty: 25 },
    { id: 'scmt-var-l',  sku: 'STRS-SCMT-001-L',  size: 'L',  isActive: true, stockQty: 25 },
    { id: 'scmt-var-xl', sku: 'STRS-SCMT-001-XL', size: 'XL', isActive: true, stockQty: 25 },
  ],
  createdAt: new Date('2026-07-17').toISOString(),
  updatedAt: new Date('2026-07-17').toISOString(),
};

export type StaticProduct = typeof LOBSTER_TEE;

/** All static products in display order. Slot index matches "All Pieces" grid position. */
export const STATIC_PRODUCTS = [LOBSTER_TEE, SEA_CALLS_ME_TEE];
