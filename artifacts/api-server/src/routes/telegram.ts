import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import {
  webhookSecretToken,
  editOrderMessage,
  type ShippingAddress,
  type OrderNotification,
  type OrderItemNotification,
} from "../lib/telegram";
import { logger } from "../lib/logger";

const router = Router();

// ─── Duplicate-callback guard ─────────────────────────────────────────────────
// Maps callbackQueryId → expiry timestamp. Cleared lazily.
const processedCallbacks = new Map<string, number>();
const CALLBACK_TTL_MS = 24 * 60 * 60 * 1000;

function isProcessed(id: string): boolean {
  const exp = processedCallbacks.get(id);
  if (!exp) return false;
  if (Date.now() > exp) {
    processedCallbacks.delete(id);
    return false;
  }
  return true;
}

function markProcessed(id: string): void {
  processedCallbacks.set(id, Date.now() + CALLBACK_TTL_MS);
  // Prune when map grows large
  if (processedCallbacks.size > 2000) {
    const now = Date.now();
    for (const [k, v] of processedCallbacks) {
      if (v < now) processedCallbacks.delete(k);
    }
  }
}

// ─── Action → DB status mapping ───────────────────────────────────────────────
const ACTION_STATUS: Record<string, "PROCESSING" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED"> = {
  confirm:   "PROCESSING",
  packed:    "PACKED",
  shipped:   "SHIPPED",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

const ACTION_TOAST: Record<string, string> = {
  confirm:   "✅ Order confirmed",
  packed:    "📦 Marked as packed",
  shipped:   "🚚 Marked as shipped",
  delivered: "✅ Marked as delivered",
  cancelled: "❌ Order cancelled",
};

// ─── answerCallbackQuery helper ────────────────────────────────────────────────
async function answerCallback(
  token: string,
  callbackQueryId: string,
  text: string,
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (err) {
    logger.error({ err }, "Telegram: answerCallbackQuery failed");
  }
}

// ─── Webhook handler ──────────────────────────────────────────────────────────

interface TelegramUpdate {
  update_id: number;
  callback_query?: {
    id: string;
    from: { id: number; username?: string; first_name?: string };
    message?: { message_id: number; chat: { id: number | string } };
    data?: string;
  };
}

/**
 * POST /api/telegram/webhook
 * Receives callback_query events from Telegram when inline buttons are pressed.
 */
router.post(
  "/telegram/webhook",
  // Express 5 raw body needs json() which is already applied globally in app.ts
  async (req, res) => {
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    if (!token) {
      res.sendStatus(403);
      return;
    }

    // Validate Telegram secret token header
    const expected = webhookSecretToken(token);
    const received = req.headers["x-telegram-bot-api-secret-token"];
    if (received !== expected) {
      logger.warn({ received }, "Telegram webhook: invalid secret token — request rejected");
      res.sendStatus(403);
      return;
    }

    const update = req.body as TelegramUpdate;

    // Immediately ACK so Telegram doesn't retry
    res.sendStatus(200);

    if (!update.callback_query) return;

    const { id: callbackId, data, from } = update.callback_query;

    if (isProcessed(callbackId)) {
      logger.info({ callbackId }, "Telegram: duplicate callback ignored");
      await answerCallback(token, callbackId, "Already processed");
      return;
    }
    markProcessed(callbackId);

    if (!data) {
      await answerCallback(token, callbackId, "");
      return;
    }

    const [action, orderId] = data.split("|");
    if (!action || !orderId) {
      await answerCallback(token, callbackId, "Malformed callback data");
      return;
    }

    const newStatus = ACTION_STATUS[action];
    if (!newStatus) {
      await answerCallback(token, callbackId, "Unknown action");
      return;
    }

    try {
      const [order] = await db
        .update(ordersTable)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(and(eq(ordersTable.id, orderId), isNull(ordersTable.deletedAt)))
        .returning();

      if (!order) {
        await answerCallback(token, callbackId, "Order not found");
        return;
      }

      logger.info(
        { orderId, newStatus, by: from?.username ?? from?.first_name },
        "Telegram: order status updated via inline button",
      );

      // Edit the Telegram message to show updated status
      if (order.telegramMessageId) {
        const items = await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, order.id));

        const notification: OrderNotification = {
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          shippingAddress: order.shippingAddress as ShippingAddress,
          items: items.map(
            (i): OrderItemNotification => ({
              productTitle: i.productTitle,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
            }),
          ),
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          total: order.total,
          paymentMethod: order.paymentMethod,
          shippingMethod: order.shippingMethod,
          status: newStatus,
        };

        await editOrderMessage(order.telegramMessageId, notification, newStatus);
      }

      await answerCallback(token, callbackId, ACTION_TOAST[action] ?? `Status: ${newStatus}`);
    } catch (err) {
      logger.error({ err, orderId }, "Telegram webhook: failed to process callback");
      await answerCallback(token, callbackId, "⚠️ Error updating order");
    }
  },
);

export default router;
