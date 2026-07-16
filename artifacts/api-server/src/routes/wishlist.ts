import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistsTable, wishlistItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

const param = (p: string | string[]): string => (Array.isArray(p) ? p[0] : p);

const router = Router();

const WishlistInputSchema = z.object({ productId: z.string() });

async function getOrCreateWishlist(userId: string) {
  const [existing] = await db
    .select()
    .from(wishlistsTable)
    .where(eq(wishlistsTable.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [wishlist] = await db.insert(wishlistsTable).values({ userId }).returning();
  return wishlist;
}

// GET /api/wishlist
router.get("/wishlist", requireAuth, async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user!.id);
    const items = await db
      .select({
        id: wishlistItemsTable.id,
        productId: wishlistItemsTable.productId,
        addedAt: wishlistItemsTable.addedAt,
        product: {
          id: productsTable.id,
          title: productsTable.title,
          slug: productsTable.slug,
          price: productsTable.price,
        },
      })
      .from(wishlistItemsTable)
      .leftJoin(productsTable, eq(wishlistItemsTable.productId, productsTable.id))
      .where(eq(wishlistItemsTable.wishlistId, wishlist.id));

    res.json(items);
  } catch (err) {
    req.log.error({ err }, "[GET /wishlist]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/wishlist
router.post("/wishlist", requireAuth, async (req, res) => {
  const result = WishlistInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  try {
    const wishlist = await getOrCreateWishlist(req.user!.id);

    await db
      .insert(wishlistItemsTable)
      .values({ wishlistId: wishlist.id, productId: result.data.productId })
      .onConflictDoNothing();

    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "[POST /wishlist]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/wishlist/:itemId
router.delete("/wishlist/:itemId", requireAuth, async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user!.id);
    await db
      .delete(wishlistItemsTable)
      .where(
        and(
          eq(wishlistItemsTable.id, param(req.params.itemId)),
          eq(wishlistItemsTable.wishlistId, wishlist.id)
        )
      );

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /wishlist/:itemId]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
