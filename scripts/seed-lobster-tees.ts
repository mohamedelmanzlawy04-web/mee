/**
 * Seed: Summer '26 — Lobster Tee collection
 * ONE product with three images (front, back, lifestyle).
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

const PRODUCT = {
  title: 'Maine Lobster Lovers Club Tee',
  slug: 'maine-lobster-lovers-club-tee',
  sku: 'STRS-MLBT-001',
  shortDescription:
    'Oversized heavyweight tee in 320 gsm cotton. Featuring a hand-illustrated Maine Lobster Club graphic screen-printed on the back.',
  description:
    "The Maine Lobster Lovers Club Tee is STRESSNES's debut Summer '26 statement piece. Crafted from 320 gsm heavyweight cotton in a relaxed oversized silhouette, it bears a hand-illustrated lobster graphic in coral-red and ocean-blue — screen-printed in the South of France. Limited run.",
  price: 1600,
  comparePrice: 2000,
  images: [
    {
      url: '/images/lobster-tee-1.jpeg',
      altText: 'STRESSNES Maine Lobster Lovers Club Tee — flat lay on coastal rocks',
      isPrimary: true,
    },
    {
      url: '/images/lobster-tee-2.jpeg',
      altText: 'STRESSNES Maine Lobster Lovers Club Tee — worn on beach, Bay Harbour',
      isPrimary: false,
    },
    {
      url: '/images/lobster-tee-3.jpeg',
      altText: 'STRESSNES Maine Lobster Lovers Club Tee — held up at the beach, seaside',
      isPrimary: false,
    },
  ],
};

async function main() {
  console.log("⏳ Seeding Summer '26 collection…");

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
    console.log("  ✓ Created collection: Summer '26");
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

  // ── Product ─────────────────────────────────────────────────
  const [existing] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.slug, PRODUCT.slug))
    .limit(1);

  if (existing) {
    console.log(`  → Product already exists: ${PRODUCT.title}`);
  } else {
    const [product] = await db
      .insert(productsTable)
      .values({
        title: PRODUCT.title,
        slug: PRODUCT.slug,
        sku: PRODUCT.sku,
        shortDescription: PRODUCT.shortDescription,
        description: PRODUCT.description,
        price: String(PRODUCT.price),
        comparePrice: String(PRODUCT.comparePrice),
        status: 'ACTIVE',
        featured: true,
        published: true,
        categoryId: category.id,
        collectionId: collection.id,
      })
      .returning();

    // Insert all three images
    for (let i = 0; i < PRODUCT.images.length; i++) {
      const img = PRODUCT.images[i];
      await db.insert(productImagesTable).values({
        productId: product.id,
        url: img.url,
        altText: img.altText,
        sortOrder: i,
        isPrimary: img.isPrimary,
      });
    }

    // Insert size variants + inventory
    for (const size of SIZES) {
      const [variant] = await db
        .insert(productVariantsTable)
        .values({
          productId: product.id,
          sku: `${PRODUCT.sku}-${size}`,
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

    console.log(`  ✓ Created product: ${PRODUCT.title} with ${PRODUCT.images.length} images`);
  }

  console.log("\n✅ Done — Summer '26 collection seeded successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
