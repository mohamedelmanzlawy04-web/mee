import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, cartItemsTable, cartsTable, productsTable } from "@workspace/db";
import { eq, and, isNull, desc, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const param = (p: string | string[]): string => (Array.isArray(p) ? p[0] : p);

const router = Router();

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  userId: z.string().optional(),
});

const OrderInputSchema = z.object({
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default("EG"),
    phone: z.string().optional(),
  }),
  shippingMethodId: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

const OrderStatusInputSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  note: z.string().optional(),
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `STR-${timestamp}-${random}`;
}

// GET /api/orders
router.get("/orders", requireAuth, async (req, res) => {
  const result = ListQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  try {
    const { page, pageSize } = result.data;
    const offset = (page - 1) * pageSize;
    const isAdmin = req.user!.role === "ADMIN";

    const conditions = [isNull(ordersTable.deletedAt)];
    if (!isAdmin) conditions.push(eq(ordersTable.userId, req.user!.id));

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [data, [{ total }]] = await Promise.all([
      db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(pageSize).offset(offset),
      db.select({ total: count() }).from(ordersTable).where(where),
    ]);

    res.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    req.log.error({ err }, "[GET /orders]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/orders
router.post("/orders", requireAuth, async (req, res) => {
  const bodyResult = OrderInputSchema.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Validation error", details: bodyResult.error.format() });
    return;
  }

  const cartId = req.query.cartId as string;
  if (!cartId) {
    res.status(400).json({ error: "cartId is required" });
    return;
  }

  try {
    // Get cart items
    const items = await db
      .select({
        id: cartItemsTable.id,
        productId: cartItemsTable.productId,
        variantId: cartItemsTable.variantId,
        quantity: cartItemsTable.quantity,
        price: cartItemsTable.price,
        productTitle: productsTable.title,
      })
      .from(cartItemsTable)
      .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
      .where(eq(cartItemsTable.cartId, cartId));

    if (items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const total = subtotal; // No shipping/tax calculation in this foundation

    const [order] = await db
      .insert(ordersTable)
      .values({
        orderNumber: generateOrderNumber(),
        userId: req.user!.id,
        subtotal: String(subtotal),
        total: String(total),
        shippingAddress: bodyResult.data.shippingAddress,
        notes: bodyResult.data.notes ?? null,
      })
      .returning();

    // Create order items
    await db.insert(orderItemsTable).values(
      items.map((item) => ({
        orderId: order.id,
        productId: item.productId!,
        variantId: item.variantId,
        productTitle: item.productTitle ?? "Unknown Product",
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: String(Number(item.price) * item.quantity),
      }))
    );

    // Clear cart
    await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cartId));

    const orderItems = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    res.status(201).json({ ...order, items: orderItems });
  } catch (err) {
    req.log.error({ err }, "[POST /orders]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/:id
router.get("/orders/:id", requireAuth, async (req, res) => {
  try {
    const conditions = [eq(ordersTable.id, param(req.params.id)), isNull(ordersTable.deletedAt)];
    if (req.user!.role !== "ADMIN") conditions.push(eq(ordersTable.userId, req.user!.id));

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(...conditions))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    res.json({ ...order, items });
  } catch (err) {
    req.log.error({ err }, "[GET /orders/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/orders/:id/status
router.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  const result = OrderStatusInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  try {
    const [order] = await db
      .update(ordersTable)
      .set({ status: result.data.status, updatedAt: new Date() })
      .where(and(eq(ordersTable.id, param(req.params.id)), isNull(ordersTable.deletedAt)))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    res.json({ ...order, items });
  } catch (err) {
    req.log.error({ err }, "[PATCH /orders/:id/status]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
