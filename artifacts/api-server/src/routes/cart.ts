import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { cartsTable, cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { optionalAuth } from "../middlewares/auth";
import { z } from "zod";

const param = (p: string | string[]): string => (Array.isArray(p) ? p[0] : p);

const router = Router();

const GUEST_CART_COOKIE = "stressnes_cart";

const CartItemInputSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1),
});

const CartItemUpdateSchema = z.object({
  quantity: z.number().int().min(1),
});

async function resolveCart(req: Request, res: Response) {
  const userId = req.user?.id;

  if (userId) {
    const [existing] = await db
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.userId, userId))
      .limit(1);

    if (existing) return existing;

    const [cart] = await db.insert(cartsTable).values({ userId }).returning();
    return cart;
  }

  // Guest cart via session cookie
  const cookies = (req as unknown as { cookies?: Record<string, string> }).cookies;
  let sessionId = cookies?.[GUEST_CART_COOKIE];

  if (sessionId) {
    const [existing] = await db
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.sessionId, sessionId))
      .limit(1);
    if (existing) return existing;
  }

  // Create a new guest cart and persist the session cookie
  if (!sessionId) sessionId = crypto.randomUUID();
  const [cart] = await db.insert(cartsTable).values({ sessionId }).returning();

  res.cookie(GUEST_CART_COOKIE, sessionId, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: "lax",
    path: "/",
  });

  return cart;
}

async function getCartWithItems(cartId: string) {
  const cart = await db.select().from(cartsTable).where(eq(cartsTable.id, cartId)).limit(1);
  if (!cart[0]) return null;

  const items = await db
    .select({
      id: cartItemsTable.id,
      cartId: cartItemsTable.cartId,
      productId: cartItemsTable.productId,
      variantId: cartItemsTable.variantId,
      quantity: cartItemsTable.quantity,
      price: cartItemsTable.price,
      product: {
        id: productsTable.id,
        title: productsTable.title,
        slug: productsTable.slug,
        price: productsTable.price,
      },
    })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.cartId, cartId));

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  return { ...cart[0], items, subtotal };
}

// GET /api/cart
router.get("/cart", optionalAuth, async (req, res) => {
  try {
    const cart = await resolveCart(req, res);
    const full = await getCartWithItems(cart.id);
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "[GET /cart]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/cart
router.post("/cart", optionalAuth, async (req, res) => {
  const result = CartItemInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const cart = await resolveCart(req, res);
    const { productId, variantId, quantity } = result.data;

    // Get product price
    const [product] = await db
      .select({ price: productsTable.price })
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    // Upsert cart item
    const existingConditions = [
      eq(cartItemsTable.cartId, cart.id),
      eq(cartItemsTable.productId, productId),
    ];
    if (variantId) existingConditions.push(eq(cartItemsTable.variantId, variantId));

    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(and(...existingConditions))
      .limit(1);

    if (existing) {
      await db
        .update(cartItemsTable)
        .set({ quantity: existing.quantity + quantity, updatedAt: new Date() })
        .where(eq(cartItemsTable.id, existing.id));
    } else {
      await db.insert(cartItemsTable).values({
        cartId: cart.id,
        productId,
        variantId: variantId ?? null,
        quantity,
        price: product.price,
      });
    }

    await db.update(cartsTable).set({ updatedAt: new Date() }).where(eq(cartsTable.id, cart.id));

    const full = await getCartWithItems(cart.id);
    res.status(201).json(full);
  } catch (err) {
    req.log.error({ err }, "[POST /cart]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cart
router.delete("/cart", optionalAuth, async (req, res) => {
  try {
    const cart = await resolveCart(req, res);
    await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /cart]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/cart/:itemId
router.patch("/cart/:itemId", optionalAuth, async (req, res) => {
  const result = CartItemUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  try {
    const cart = await resolveCart(req, res);
    const [item] = await db
      .select()
      .from(cartItemsTable)
      .where(and(eq(cartItemsTable.id, param(req.params.itemId)), eq(cartItemsTable.cartId, cart.id)))
      .limit(1);

    if (!item) {
      res.status(404).json({ error: "Cart item not found" });
      return;
    }

    await db
      .update(cartItemsTable)
      .set({ quantity: result.data.quantity, updatedAt: new Date() })
      .where(eq(cartItemsTable.id, item.id));

    const full = await getCartWithItems(cart.id);
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "[PATCH /cart/:itemId]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cart/:itemId
router.delete("/cart/:itemId", optionalAuth, async (req, res) => {
  try {
    const cart = await resolveCart(req, res);
    await db
      .delete(cartItemsTable)
      .where(and(eq(cartItemsTable.id, param(req.params.itemId)), eq(cartItemsTable.cartId, cart.id)));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /cart/:itemId]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
