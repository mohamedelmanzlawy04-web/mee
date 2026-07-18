/**
 * Seed: Summer '26 collection — Lobster Tee, Sea Calls Me Tee, Bonna Appétit Tee
 * Run: pnpm --filter @workspace/db run seed
 */
import { db, pool } from './index.js';
import {
  collectionsTable,
  categoriesTable,
  productsTable,
  productImagesTable,
  productVariantsTable,
  inventoryTable,
} from './index.js';
import { eq } from 'drizzle-orm';

const PRODUCTS = [
  {
    title: 'Lobster Tee',
    slug: 'lobster-tee',
    sku: 'STRS-LBST-001',
    shortDescription: 'BOXY FIT',
    description:
      "The STRESSNES Lobster Tee is the debut Summer '26 statement piece. Crafted from 320 gsm heavyweight cotton in a relaxed oversized silhouette, it bears a hand-illustrated lobster graphic in coral-red and ocean-blue — screen-printed on the back. Limited run.",
    price: 700,
    comparePrice: null,
    sizes: ['M', 'L', 'XL'],
    images: [
      { url: '/images/lobster-tee-1.jpeg', altText: 'STRESSNES Lobster Tee — flat lay on coastal rocks', isPrimary: true },
      { url: '/images/lobster-tee-2.jpeg', altText: 'STRESSNES Lobster Tee — worn on the beach, back graphic', isPrimary: false },
      { url: '/images/lobster-tee-3.jpeg', altText: 'STRESSNES Lobster Tee — held at the seaside, lifestyle shot', isPrimary: false },
    ],
  },
  {
    title: 'Sea Calls Me Tee',
    slug: 'sea-calls-me-tee',
    sku: 'STRS-SCMT-001',
    shortDescription: 'BOXY FIT',
    description:
      "The STRESSNES Sea Calls Me Tee is the second Summer '26 drop. Crafted from 320 gsm heavyweight cotton in a relaxed oversized silhouette, it features a hand-illustrated seashell motif with the phrase 'Saltwater Heals Everything' screen-printed on the back. Limited run.",
    price: 700,
    comparePrice: null,
    sizes: ['M', 'L', 'XL'],
    images: [
      { url: '/images/sea-calls-me-1.jpeg', altText: 'STRESSNES Sea Calls Me Tee — flat lay on beach sand', isPrimary: true },
      { url: '/images/sea-calls-me-2.jpeg', altText: 'STRESSNES Sea Calls Me Tee — back graphic detail, worn seaside', isPrimary: false },
      { url: '/images/sea-calls-me-3.jpeg', altText: 'STRESSNES Sea Calls Me Tee — full back lifestyle shot on the shore', isPrimary: false },
    ],
  },
  {
    title: 'Bonna Appétit Tee',
    slug: 'bonna-appetit-tee',
    sku: 'STRS-BNAT-001',
    shortDescription: 'REGULAR FIT',
    description:
      "The STRESSNES Bonna Appétit Tee is the third Summer '26 drop. A vibrant celebration of coastal dining — hand-illustrated tropical fruits and the phrase 'Bon Appétit' screen-printed front and back. Cut in a classic regular fit from 280 gsm cotton. Limited run.",
    price: 700,
    comparePrice: null,
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      { url: '/images/bonna-appetit-1.jpeg', altText: 'STRESSNES Bonna Appétit Tee — worn at the beach, front graphic', isPrimary: true },
      { url: '/images/bonna-appetit-2.jpeg', altText: 'STRESSNES Bonna Appétit Tee — back graphic, lifestyle promenade shot', isPrimary: false },
      { url: '/images/bonna-appetit-3.jpeg', altText: 'STRESSNES Bonna Appétit Tee — back graphic, seaside lifestyle shot', isPrimary: false },
    ],
  },
];

async function main() {
  console.log("⏳ Seeding Summer '26 collection…");

  // Collection
  let [collection] = await db.select().from(collectionsTable).where(eq(collectionsTable.slug, 'summer-26')).limit(1);
  if (!collection) {
    [collection] = await db.insert(collectionsTable).values({
      name: "Summer '26", slug: 'summer-26',
      description: 'The Summer 2026 collection — designed for those who escape.',
      isActive: true, sortOrder: 1,
    }).returning();
    console.log("  ✓ Created collection: Summer '26");
  } else {
    console.log('  → Collection already exists');
  }

  // Category
  let [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, 't-shirts')).limit(1);
  if (!category) {
    [category] = await db.insert(categoriesTable).values({
      name: 'T-Shirts', slug: 't-shirts',
      description: 'Premium graphic tees.', isActive: true, sortOrder: 1,
    }).returning();
    console.log('  ✓ Created category: T-Shirts');
  } else {
    console.log('  → Category already exists');
  }

  // Products
  for (const P of PRODUCTS) {
    const [existing] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.slug, P.slug)).limit(1);
    if (existing) { console.log(`  → Already exists: ${P.title}`); continue; }

    const [product] = await db.insert(productsTable).values({
      title: P.title, slug: P.slug, sku: P.sku,
      shortDescription: P.shortDescription, description: P.description,
      price: String(P.price), comparePrice: String(P.comparePrice),
      status: 'ACTIVE', featured: true, published: true,
      categoryId: category.id, collectionId: collection.id,
    }).returning();

    for (let i = 0; i < P.images.length; i++) {
      await db.insert(productImagesTable).values({
        productId: product.id, url: P.images[i].url,
        altText: P.images[i].altText, sortOrder: i, isPrimary: P.images[i].isPrimary,
      });
    }

    for (const size of P.sizes) {
      const [variant] = await db.insert(productVariantsTable).values({
        productId: product.id, sku: `${P.sku}-${size}`, size, isActive: true,
      }).returning();
      await db.insert(inventoryTable).values({ variantId: variant.id, stockQty: 25, lowStockThreshold: 5 });
    }

    console.log(`  ✓ Seeded: ${P.title} (${P.sizes.join(', ')}) + ${P.images.length} images`);
  }

  console.log("\n✅ Done.");
  await pool.end();
}

main().catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); });
