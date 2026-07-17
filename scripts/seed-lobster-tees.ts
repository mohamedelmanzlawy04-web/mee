/**
 * Seed: Summer '26 — Lobster Tee collection
 * Run: pnpm tsx scripts/seed-lobster-tees.ts
 */
import { db } from '../lib/db/src/index.ts';
import {
  collectionsTable,
  categoriesTable,
  productsTable,
  productImagesTable,
  productVariantsTable,
  inventoryTable,
} from '../lib/db/src/index.ts';
import { eq } from 'drizzle-orm';

const SIZES = ['S', 'M', 'L', 'XL'];

const PRODUCTS = [
  {
    title: 'Maine Lobster Lovers Club Tee',
    slug: 'maine-lobster-lovers-club-tee',
    sku: 'STRS-MLBT-001',
    shortDescription: 'Oversized heavyweight tee in 320 gsm cotton. Featuring a hand-illustrated Maine Lobster Club graphic screen-printed on the back.',
    description: 'The Maine Lobster Lovers Club Tee is STRESSNES\'s debut Summer \'26 statement piece. Crafted from 320 gsm heavyweight cotton in a relaxed oversized silhouette, it bears a hand-illustrated lobster graphic in coral-red and ocean-blue — screen-printed in the South of France. Limited run.',
    price: 1600,
    comparePrice: 2000,
    image: '/images/lobster-tee-1.jpeg',
    alt: 'STRESSNES Maine Lobster Lovers Club Tee — flat lay on coastal rocks',
  },
  {
    title: 'Lobster Club Tee — Bay Harbour',
    slug: 'lobster-club-tee-bay-harbour',
    sku: 'STRS-MLBT-002',
    shortDescription: 'The signature Bay Harbour edition — worn oversized with the graphic facing out. 320 gsm cotton, unisex fit.',
    description: 'The Bay Harbour edition of the Maine Lobster Lovers Club Tee, worn on location at the STRESSNES Summer \'26 shoot. Same oversized heavyweight cotton construction, with the \'Everyone Welcome\' inscription beneath the lobster illustration. A collectors piece.',
    price: 1600,
    comparePrice: 2000,
    image: '/images/lobster-tee-2.jpeg',
    alt: 'STRESSNES Lobster Club Tee — model wearing on beach, Bay Harbour',
  },
  {
    title: 'Lobster Club Tee — Seaside Edit',
    slug: 'lobster-club-tee-seaside-edit',
    sku: 'STRS-MLBT-003',
    shortDescription: 'The Seaside Edit — styled at the water\'s edge. Same heavyweight drop-shoulder construction with the full back graphic.',
    description: 'Shot at the STRESSNES Summer \'26 location alongside the Mediterranean coastline, the Seaside Edit captures the tee in its natural element. 320 gsm relaxed-fit cotton with full-colour lobster illustration. Part of a limited production run.',
    price: 1600,
    comparePrice: 2000,
    image: '/images/lobster-tee-3.jpeg',
    alt: 'STRESSNES Lobster Club Tee — held up at the beach, Seaside Edit',
  },
];

async function main() {
  console.log('⏳ Seeding Summer \'26 collection…');

  // ── Collection ───────────────────────────────────────────────
  let [collection] = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.slug, 'summer-26'))
    .limit(1);

  if (!collection) {
    [collection] = await db
      .insert(collectionsTable)
      .values({
        name: "Summer '26",
        slug: 'summer-26',
        description: 'The Summer 2026 collection — designed for those who escape.',
        isActive: true,
        sortOrder: 1,
      })
      .returning();
    console.log('  ✓ Created collection: Summer \'26');
  } else {
    console.log('  → Collection already exists');
  }

  // ── Category ────────────────────────────────────────────────
  let [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, 't-shirts'))
    .limit(1);

  if (!category) {
    [category] = await db
      .insert(categoriesTable)
      .values({
        name: 'T-Shirts',
        slug: 't-shirts',
        description: 'Premium oversized graphic tees.',
        isActive: true,
        sortOrder: 1,
      })
      .returning();
    console.log('  ✓ Created category: T-Shirts');
  } else {
    console.log('  → Category already exists');
  }

  // ── Products ────────────────────────────────────────────────
  for (const p of PRODUCTS) {
    const [existing] = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.slug, p.slug))
      .limit(1);

    if (existing) {
      console.log(`  → Product already exists: ${p.title}`);
      continue;
    }

    // Insert product
    const [product] = await db
      .insert(productsTable)
      .values({
        title: p.title,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        price: String(p.price),
        comparePrice: String(p.comparePrice),
        status: 'ACTIVE',
        featured: true,
        published: true,
        categoryId: category.id,
        collectionId: collection.id,
      })
      .returning();

    // Insert primary image
    await db.insert(productImagesTable).values({
      productId: product.id,
      url: p.image,
      altText: p.alt,
      sortOrder: 0,
      isPrimary: true,
    });

    // Insert size variants + inventory
    for (const size of SIZES) {
      const [variant] = await db
        .insert(productVariantsTable)
        .values({
          productId: product.id,
          sku: `${p.sku}-${size}`,
          size,
          isActive: true,
        })
        .returning();

      await db.insert(inventoryTable).values({
        variantId: variant.id,
        stockQty: 25,
        lowStockThreshold: 5,
      });
    }

    console.log(`  ✓ Created product: ${p.title}`);
  }

  console.log('\n✅ Done — Summer \'26 collection seeded successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
