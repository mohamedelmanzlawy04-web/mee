import { Router, type Request } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, cartItemsTable, cartsTable, productsTable, governoratesTable, productVariantsTable } from "@workspace/db";
import { eq, and, isNull, desc, count, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth";
import { z } from "zod";
import { sendOrderNotification, editOrderMessage, type ShippingAddress, type OrderNotification, type OrderItemNotification } from "../lib/telegram";
import { logger } from "../lib/logger";

const PaymentVerifyInputSchema = z.object({
  action: z.enum(["VERIFY", "REJECT"]),
  rejectionReason: z.string().optional(),
});

const GUEST_CART_COOKIE = "stressnes_cart";

/**
 * Look up the cart that belongs to the current session — either the
 * authenticated user's cart or the guest's cookie-bound cart.
 * Does NOT create a new cart; returns null when none is found.
 */
async function lookupCartBySession(req: Request) {
  const userId = req.user?.id;

  if (userId) {
    const [cart] = await db
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.userId, userId))
      .limit(1);
    return cart ?? null;
  }

  const cookies = (req as unknown as { cookies?: Record<string, string> }).cookies;
  const sessionId = cookies?.[GUEST_CART_COOKIE];
  if (!sessionId) return null;

  const [cart] = await db
    .select()
    .from(cartsTable)
    .where(eq(cartsTable.sessionId, sessionId))
    .limit(1);
  return cart ?? null;
}

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
    email: z.string().email().optional(),
  }),
  governorateId: z.string().optional(),
  cityId: z.string().optional(),
  shippingMethodId: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["COD", "INSTAPAY", "EWALLET"]).default("COD"),
  paymentScreenshotUrl: z.string().optional(),
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
// Cart is resolved server-side from the authenticated user session or guest cookie —
// the client-provided cartId query param is intentionally ignored to prevent IDOR.
router.post("/orders", optionalAuth, async (req, res) => {
  const bodyResult = OrderInputSchema.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Validation error", details: bodyResult.error.format() });
    return;
  }

  try {
    // Resolve cart ownership server-side — never trust client-supplied cartId
    const cart = await lookupCartBySession(req);
    if (!cart) {
      res.status(400).json({ error: "No active cart found for this session" });
      return;
    }

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
      .where(eq(cartItemsTable.cartId, cart.id));

    if (items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    // Resolve shipping cost from governorate if provided
    let shippingCost = 0;
    let shippingMethod: string | null = null;
    if (bodyResult.data.governorateId) {
      const [gov] = await db
        .select({ name: governoratesTable.name, shippingPrice: governoratesTable.shippingPrice, estimatedDays: governoratesTable.estimatedDays })
        .from(governoratesTable)
        .where(eq(governoratesTable.id, bodyResult.data.governorateId))
        .limit(1);
      if (gov) {
        shippingCost = Number(gov.shippingPrice);
        shippingMethod = `${gov.name} — ${gov.estimatedDays} day${gov.estimatedDays !== 1 ? 's' : ''}`;
      }
    }

    const total = subtotal + shippingCost;

    const paymentMethod = bodyResult.data.paymentMethod ?? "COD";
    const paymentStatus = paymentMethod === "COD" ? "COD" as const : "WAITING_FOR_VERIFICATION" as const;

    // Enrich shippingAddress with IDs so they travel with the order record
    const shippingAddress = {
      ...bodyResult.data.shippingAddress,
      ...(bodyResult.data.governorateId ? { governorateId: bodyResult.data.governorateId } : {}),
      ...(bodyResult.data.cityId ? { cityId: bodyResult.data.cityId } : {}),
    };

    const [order] = await db
      .insert(ordersTable)
      .values({
        orderNumber: generateOrderNumber(),
        userId: req.user?.id ?? null,
        subtotal: String(subtotal),
        shippingCost: String(shippingCost),
        total: String(total),
        shippingAddress,
        shippingMethod: shippingMethod ?? null,
        notes: bodyResult.data.notes ?? null,
        paymentMethod,
        paymentStatus,
        paymentScreenshotUrl: bodyResult.data.paymentScreenshotUrl ?? null,
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

    // Clear the session-owned cart items
    await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

    const orderItems = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    res.status(201).json({ ...order, items: orderItems });

    // Fire Telegram notification after responding — never blocks the client
    (async () => {
      const orderId = order.id;
      const orderNumber = order.orderNumber;
      logger.info({ orderId, orderNumber }, "[Telegram] notification task started");

      try {
        // Fetch variant size/color for items that have a variant
        const variantIds = orderItems.map((i) => i.variantId).filter((id): id is string => !!id);
        const variantMap = new Map<string, { size: string | null; color: string | null }>();
        if (variantIds.length > 0) {
          logger.info({ orderId, variantIds }, "[Telegram] fetching variant details");
          const variants = await db
            .select({ id: productVariantsTable.id, size: productVariantsTable.size, color: productVariantsTable.color })
            .from(productVariantsTable)
            .where(inArray(productVariantsTable.id, variantIds));
          for (const v of variants) variantMap.set(v.id, { size: v.size, color: v.color });
          logger.info({ orderId, variantCount: variants.length }, "[Telegram] variants fetched");
        }

        const notification: OrderNotification = {
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          shippingAddress: order.shippingAddress as ShippingAddress,
          items: orderItems.map((item): OrderItemNotification => ({
            productTitle: item.productTitle,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            ...(item.variantId ? variantMap.get(item.variantId) : {}),
          })),
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          total: order.total,
          paymentMethod: order.paymentMethod,
          shippingMethod: order.shippingMethod,
        };

        logger.info({ orderId, orderNumber, itemCount: notification.items.length }, "[Telegram] calling sendOrderNotification");
        const telegramMessageId = await sendOrderNotification(notification);
        logger.info({ orderId, orderNumber, telegramMessageId }, "[Telegram] sendOrderNotification returned");

        // Store the Telegram message_id so status buttons can edit it later
        if (telegramMessageId) {
          await db
            .update(ordersTable)
            .set({ telegramMessageId })
            .where(eq(ordersTable.id, order.id));
          logger.info({ orderId, telegramMessageId }, "[Telegram] message_id saved to order");
        } else {
          logger.warn({ orderId }, "[Telegram] no message_id returned — notification may have failed");
        }
      } catch (err) {
        logger.error({ err, orderId, orderNumber }, "[Telegram] unhandled error in notification task");
      }
    })();
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

// PATCH /api/orders/:id/payment — verify or reject a payment (admin only)
router.patch("/orders/:id/payment", requireAdmin, async (req, res) => {
  const result = PaymentVerifyInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  try {
    const { action, rejectionReason } = result.data;
    const paymentStatus = action === "VERIFY" ? "PAID" as const : "REJECTED" as const;
    const orderStatus = action === "VERIFY" ? "PROCESSING" as const : undefined;

    const [order] = await db
      .update(ordersTable)
      .set({
        paymentStatus,
        ...(orderStatus ? { status: orderStatus } : {}),
        ...(action === "REJECT" ? { paymentRejectionReason: rejectionReason ?? "Payment rejected by admin" } : { paymentRejectionReason: null }),
        updatedAt: new Date(),
      })
      .where(and(eq(ordersTable.id, param(req.params.id)), isNull(ordersTable.deletedAt)))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    res.json({ ...order, items });
  } catch (err) {
    req.log.error({ err }, "[PATCH /orders/:id/payment]");
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

    // Edit the Telegram message to reflect the new status (fire-and-forget)
    if (order.telegramMessageId) {
      const notification: OrderNotification = {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress as ShippingAddress,
        items: items.map((i): OrderItemNotification => ({
          productTitle: i.productTitle,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        paymentMethod: order.paymentMethod,
        shippingMethod: order.shippingMethod,
        status: result.data.status,
      };
      editOrderMessage(order.telegramMessageId, notification, result.data.status).catch((err) =>
        req.log.error({ err }, "[PATCH /orders/:id/status] Telegram edit failed"),
      );
    }
  } catch (err) {
    req.log.error({ err }, "[PATCH /orders/:id/status]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
