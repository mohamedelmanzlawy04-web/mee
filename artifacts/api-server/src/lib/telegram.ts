import { logger } from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItemNotification {
  productTitle: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  size?: string | null;
  color?: string | null;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export interface OrderNotification {
  id: string;
  orderNumber: string;
  createdAt: Date;
  shippingAddress: ShippingAddress;
  items: OrderItemNotification[];
  subtotal: string | number;
  shippingCost: string | number;
  total: string | number;
  paymentMethod: string;
  shippingMethod?: string | null;
  status?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_LABELS: Record<string, string> = {
  COD: "💵 Cash on Delivery",
  INSTAPAY: "📲 InstaPay",
  EWALLET: "📱 E-Wallet",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "⏳ Pending",
  PAID: "💳 Paid",
  PROCESSING: "🔄 Processing",
  PACKED: "📦 Packed",
  SHIPPED: "🚚 Shipped",
  DELIVERED: "✅ Delivered",
  CANCELLED: "❌ Cancelled",
  REFUNDED: "↩️ Refunded",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: string | number): string {
  return `${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EGP`;
}

export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildOrderMessage(order: OrderNotification, status?: string): string {
  const addr = order.shippingAddress;
  const customerName = `${addr.firstName} ${addr.lastName}`.trim();
  const phone = addr.phone ?? "—";
  const email = addr.email;

  const addressParts = [addr.line1, addr.line2, addr.city, addr.state, addr.country]
    .filter(Boolean)
    .join(", ");

  const orderDate = new Date(order.createdAt).toLocaleString("en-US", {
    timeZone: "Africa/Cairo",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const itemLines = order.items
    .map((item) => {
      const attrs: string[] = [];
      if (item.size) attrs.push(`Size: ${item.size}`);
      if (item.color) attrs.push(`Color: ${item.color}`);
      const attrStr = attrs.length > 0 ? ` <i>(${attrs.join(" · ")})</i>` : "";
      return (
        `  • <b>${escapeHtml(item.productTitle)}</b> × ${item.quantity}${attrStr}\n` +
        `    ${fmt(item.unitPrice)} each → <b>${fmt(item.totalPrice)}</b>`
      );
    })
    .join("\n");

  const currentStatus = status ?? order.status ?? "PENDING";

  const lines: (string | null)[] = [
    `🛍️ <b>New Order — ${escapeHtml(order.orderNumber)}</b>`,
    `🕒 ${orderDate}`,
    "",
    "👤 <b>Customer</b>",
    `Name: ${escapeHtml(customerName)}`,
    `📞 Phone: ${escapeHtml(phone)}`,
    email ? `📧 Email: ${escapeHtml(email)}` : null,
    "",
    "📍 <b>Shipping Address</b>",
    escapeHtml(addressParts),
    order.shippingMethod ? `Method: ${escapeHtml(order.shippingMethod)}` : null,
    "",
    "🛒 <b>Items</b>",
    itemLines,
    "",
    "💰 <b>Order Summary</b>",
    `Subtotal:   ${fmt(order.subtotal)}`,
    `🚚 Shipping: ${fmt(order.shippingCost)}`,
    `<b>💵 Total:    ${fmt(order.total)}</b>`,
    "",
    `💳 <b>Payment:</b> ${PAYMENT_LABELS[order.paymentMethod] ?? escapeHtml(order.paymentMethod)}`,
    "",
    `📌 <b>Status:</b> ${STATUS_LABELS[currentStatus] ?? currentStatus}`,
  ];

  return lines.filter((l): l is string => l !== null).join("\n");
}

function buildInlineKeyboard(
  orderId: string,
  phone: string,
  customerName: string,
  orderNumber: string,
) {
  const waMessage = encodeURIComponent(
    `Hi ${customerName}! 👋\n\n` +
    `Thank you for placing your order with STRESSNES.\n\n` +
    `We've received your order #${orderNumber} and we're getting everything ready. ` +
    `Before we start processing it, we'd like to quickly confirm your order with you.\n\n` +
    `Please reply with "Confirm" to let us know you'd like to proceed.\n\n` +
    `If you'd like to make any changes to your order or shipping details, simply reply to this message and we'll be happy to help.\n\n` +
    `Thank you for choosing STRESSNES.\n` +
    `We can't wait for you to receive your order! ☀️🌊`,
  );

  // Normalise to international format with Egypt country code (20)
  const digits = phone.replace(/\D/g, "");
  const intlPhone = digits.startsWith("20")
    ? digits
    : digits.startsWith("0")
    ? `2${digits}`
    : `20${digits}`;

  return {
    inline_keyboard: [
      [
        { text: "💬 WhatsApp", url: `https://wa.me/${intlPhone}?text=${waMessage}` },
        { text: "📞 Call", url: `https://wa.me/${intlPhone}` },
      ],
      [
        { text: "✅ Confirm",   callback_data: `confirm|${orderId}` },
        { text: "📦 Packed",   callback_data: `packed|${orderId}` },
        { text: "🚚 Shipped",  callback_data: `shipped|${orderId}` },
      ],
      [
        { text: "✅ Delivered", callback_data: `delivered|${orderId}` },
        { text: "❌ Cancelled", callback_data: `cancelled|${orderId}` },
      ],
    ],
  };
}

// ─── Low-level API call ───────────────────────────────────────────────────────

async function telegramPost<T = unknown>(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Always read the body — Telegram returns HTTP 200 even for API-level errors
  const json = await res.json().catch(async () => {
    const text = await res.text().catch(() => "(unreadable body)");
    throw new Error(`Telegram ${method} HTTP ${res.status}: non-JSON response: ${text}`);
  }) as Record<string, unknown>;

  if (!res.ok || json["ok"] === false) {
    const description = json["description"] ?? "(no description)";
    const errorCode = json["error_code"] ?? res.status;
    throw new Error(`Telegram ${method} failed (${errorCode}): ${description}`);
  }

  return json as T;
}

// ─── Webhook secret ───────────────────────────────────────────────────────────

/**
 * Derives a stable secret token from the bot token.
 * Only A-Z a-z 0-9 _ - are allowed by the Telegram API (max 256 chars).
 */
export function webhookSecretToken(botToken: string): string {
  return botToken.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 256);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send an order notification. Returns the Telegram message_id so the caller
 * can store it for later edits. Never throws — errors are only logged.
 */
export async function sendOrderNotification(
  order: OrderNotification,
): Promise<number | null> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];

  logger.info(
    {
      hasToken: !!token,
      hasChatId: !!chatId,
      orderNumber: order.orderNumber,
    },
    "[Telegram] sendOrderNotification called",
  );

  if (!token || !chatId) {
    logger.warn(
      { hasToken: !!token, hasChatId: !!chatId },
      "[Telegram] notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set",
    );
    return null;
  }

  const addr = order.shippingAddress;
  const customerName = `${addr.firstName} ${addr.lastName}`.trim();
  const phone = addr.phone ?? "";

  const text = buildOrderMessage(order);
  const reply_markup = buildInlineKeyboard(order.id, phone, customerName, order.orderNumber);

  logger.info(
    { orderNumber: order.orderNumber, chatId, textLength: text.length },
    "[Telegram] sending sendMessage request",
  );

  try {
    const result = await telegramPost<{ result: { message_id: number } }>(
      token,
      "sendMessage",
      { chat_id: chatId, text, parse_mode: "HTML", reply_markup },
    );
    const messageId = result.result.message_id;
    logger.info({ orderNumber: order.orderNumber, messageId }, "[Telegram] order notification sent successfully");
    return messageId;
  } catch (err) {
    logger.error({ err, orderNumber: order.orderNumber }, "[Telegram] sendOrderNotification failed — exact API error above");
    return null;
  }
}

/**
 * Edit an existing order message to reflect a new status.
 * Never throws.
 */
export async function editOrderMessage(
  messageId: number,
  order: OrderNotification,
  newStatus: string,
): Promise<void> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];
  if (!token || !chatId) return;

  const addr = order.shippingAddress;
  const customerName = `${addr.firstName} ${addr.lastName}`.trim();
  const phone = addr.phone ?? "";

  const text = buildOrderMessage(order, newStatus);
  const reply_markup = buildInlineKeyboard(order.id, phone, customerName, order.orderNumber);

  try {
    await telegramPost(token, "editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup,
    });
    logger.info({ messageId, newStatus }, "Telegram message edited");
  } catch (err) {
    logger.error({ err }, "Telegram editOrderMessage failed");
  }
}

/**
 * Send a plain notification message (no buttons). Never throws.
 */
export async function sendNotification(text: string): Promise<void> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];
  if (!token || !chatId) return;

  try {
    await telegramPost(token, "sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    });
  } catch (err) {
    logger.error({ err }, "Telegram sendNotification failed");
  }
}

export interface DailyReportStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
  cancelledOrders: number;
  pendingOrders: number;
  topProducts: { title: string; qty: number }[];
  lowStockProducts: { title: string; stock: number }[];
}

/** Send the nightly summary report. Never throws. */
export async function sendDailyReport(stats: DailyReportStats): Promise<void> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];
  if (!token || !chatId) return;

  const reportDate = new Date().toLocaleDateString("en-US", {
    timeZone: "Africa/Cairo",
    dateStyle: "full",
  });

  const topItems =
    stats.topProducts.length > 0
      ? stats.topProducts
          .map((p, i) => `  ${i + 1}. ${escapeHtml(p.title)} — ${p.qty} sold`)
          .join("\n")
      : "  —";

  const lowStock =
    stats.lowStockProducts.length > 0
      ? stats.lowStockProducts
          .map((p) => `  ⚠️ ${escapeHtml(p.title)} — ${p.stock} left`)
          .join("\n")
      : "  All products well-stocked ✅";

  const text = [
    `📊 <b>Daily Sales Report</b>`,
    `📅 ${reportDate}`,
    "",
    `📦 Total Orders:         <b>${stats.totalOrders}</b>`,
    `💰 Total Revenue:        <b>${fmt(stats.totalRevenue)}</b>`,
    `📈 Avg Order Value:      <b>${fmt(stats.avgOrderValue)}</b>`,
    `👥 New Customers:        <b>${stats.newCustomers}</b>`,
    `🔄 Returning Customers:  <b>${stats.returningCustomers}</b>`,
    `❌ Cancelled Orders:     <b>${stats.cancelledOrders}</b>`,
    `⏳ Pending Orders:       <b>${stats.pendingOrders}</b>`,
    "",
    "🏆 <b>Top Selling Products</b>",
    topItems,
    "",
    "📉 <b>Low Stock Products</b>",
    lowStock,
  ].join("\n");

  try {
    await telegramPost(token, "sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    });
    logger.info("Telegram daily report sent");
  } catch (err) {
    logger.error({ err }, "Telegram sendDailyReport failed");
  }
}

/** Register this server as Telegram's webhook endpoint. Never throws. */
export async function registerWebhook(webhookUrl: string): Promise<void> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) {
    logger.warn("Telegram webhook registration skipped: no TELEGRAM_BOT_TOKEN");
    return;
  }

  try {
    await telegramPost(token, "setWebhook", {
      url: webhookUrl,
      secret_token: webhookSecretToken(token),
      allowed_updates: ["callback_query"],
    });
    logger.info({ webhookUrl }, "Telegram webhook registered");
  } catch (err) {
    logger.error({ err }, "Telegram registerWebhook failed");
  }
}
