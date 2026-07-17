/**
 * Fix: Consolidate the three wrongly-created Lobster Tee products into one.
 *
 * The seed was run with 3 separate products (one per photo).
 * This script:
 *   1. Keeps the first product (maine-lobster-lovers-club-tee)
 *   2. Adds the missing 2nd and 3rd images to it
 *   3. Deletes the two extra products and their related data
 *
 * Run: pnpm tsx scripts/fix-lobster-tee-products.ts
 */
import { db } from '../lib/db/src/index.ts';
import {
  productsTable,
  productImagesTable,
  productVariantsTable,
  inventoryTable,
  cartItemsTable,
  wishlistItemsTable,
  orderItemsTable,
} from '../lib/db/src/index.ts';
import { eq, inArray } from 'drizzle-orm';

const KEEP_SLUG   = 'maine-lobster-lovers-club-tee';
const DELETE_SLUGS = ['lobster-club-tee-bay-harbour', 'lobster-club-tee-seaside-edit'];

const EXTRA_IMAGES = [
  {
    url: '/images/lobster-tee-2.jpeg',
    altText: 'STRESSNES Maine Lobster Lovers Club Tee — worn on beach, Bay Harbour',
    sortOrder: 1,
    isPrimary: false,
  },
  {
    url: '/images/lobster-tee-3.jpeg',
    altText: 'STRESSNES Maine Lobster Lovers Club Tee — held up at the beach, seaside',
    sortOrder: 2,
    isPrimary: false,
  },
];

async function main() {
  console.log('⏳ Fixing Lobster Tee product catalog…');

  // ── Find the product to keep ─────────────────────────────────
  const [keeper] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.slug, KEEP_SLUG))
    .limit(1);

  if (!keeper) {
    console.log(`  ✗ Product "${KEEP_SLUG}" not found — run seed script first.`);
    process.exit(1);
  }
  console.log(`  → Keeping product: ${keeper.title} (${keeper.id})`);

  // ── Ensure all 3 images exist on the keeper ──────────────────
  const existingImages = await db
    .select({ url: productImagesTable.url })
    .from(productImagesTable)
    .where(eq(productImagesTable.productId, keeper.id));

  const existingUrls = new Set(existingImages.map((i) => i.url));

  for (const img of EXTRA_IMAGES) {
    if (existingUrls.has(img.url)) {
      console.log(`  → Image already attached: ${img.url}`);
    } else {
      await db.insert(productImagesTable).values({
        productId: keeper.id,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      });
      console.log(`  ✓ Added image: ${img.url}`);
    }
  }

  // ── Delete extra products ─────────────────────────────────────
  const toDelete = await db
    .select({ id: productsTable.id, title: productsTable.title })
    .from(productsTable)
    .where(inArray(productsTable.slug, DELETE_SLUGS));

  if (toDelete.length === 0) {
    console.log('  → No extra products to delete (already clean).');
  }

  for (const p of toDelete) {
    console.log(`  ✗ Deleting extra product: ${p.title} (${p.id})`);

    // Get variant IDs for this product
    const variants = await db
      .select({ id: productVariantsTable.id })
      .from(productVariantsTable)
      .where(eq(productVariantsTable.productId, p.id));

    const variantIds = variants.map((v) => v.id);

    // Delete inventory entries
    if (variantIds.length > 0) {
      await db.delete(inventoryTable).where(inArray(inventoryTable.variantId, variantIds));
    }

    // Delete cart items referencing this product
    await db.delete(cartItemsTable).where(eq(cartItemsTable.productId, p.id));

    // Delete wishlist items
    await db.delete(wishlistItemsTable).where(eq(wishlistItemsTable.productId, p.id));

    // Delete order items (soft reference — keep for history if needed)
    // await db.delete(orderItemsTable).where(eq(orderItemsTable.productId, p.id));

    // Delete variants
    await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, p.id));

    // Delete images
    await db.delete(productImagesTable).where(eq(productImagesTable.productId, p.id));

    // Delete the product itself
    await db.delete(productsTable).where(eq(productsTable.id, p.id));

    console.log(`    ✓ Deleted.`);
  }

  console.log('\n✅ Done — catalog now has 1 T-shirt with 3 images.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fix failed:', err);
  process.exit(1);
});
