import { logger } from "./logger";

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
  orderNumber: string;
  createdAt: Date;
  shippingAddress: ShippingAddress;
  items: OrderItemNotification[];
  subtotal: string | number;
  shippingCost: string | number;
  total: string | number;
  paymentMethod: string;
  shippingMethod?: string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  COD: "💵 Cash on Delivery",
  INSTAPAY: "📲 InstaPay",
  EWALLET: "📱 E-Wallet",
};

function fmt(amount: string | number): string {
  return `${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EGP`;
}

function buildMessage(order: OrderNotification): string {
  const addr = order.shippingAddress;
  const customerName = `${addr.firstName} ${addr.lastName}`.trim();
  const phone = addr.phone ?? "—";

  const addressParts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country]
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

  const lines: (string | null)[] = [
    `🛍️ <b>New Order — ${escapeHtml(order.orderNumber)}</b>`,
    `🕐 ${orderDate}`,
    "",
    "👤 <b>Customer</b>",
    `Name: ${escapeHtml(customerName)}`,
    `Phone: ${escapeHtml(phone)}`,
    "",
    "📦 <b>Shipping Address</b>",
    escapeHtml(addressParts),
    order.shippingMethod ? `Method: ${escapeHtml(order.shippingMethod)}` : null,
    "",
    "🧾 <b>Items</b>",
    itemLines,
    "",
    "💰 <b>Order Summary</b>",
    `Subtotal:  ${fmt(order.subtotal)}`,
    `Shipping:  ${fmt(order.shippingCost)}`,
    `<b>Total:     ${fmt(order.total)}</b>`,
    "",
    `💳 <b>Payment:</b> ${PAYMENT_LABELS[order.paymentMethod] ?? escapeHtml(order.paymentMethod)}`,
  ];

  return lines.filter((l): l is string => l !== null).join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Send an order notification to Telegram.
 * Never throws — errors are logged so the order flow is unaffected.
 */
export async function sendOrderNotification(order: OrderNotification): Promise<void> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];

  if (!token || !chatId) {
    logger.warn("Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured");
    return;
  }

  const text = buildMessage(order);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "(unreadable)");
      logger.error(
        { status: res.status, body },
        "Telegram notification: API returned non-OK status"
      );
    } else {
      logger.info({ orderNumber: order.orderNumber }, "Telegram notification sent");
    }
  } catch (err) {
    logger.error({ err }, "Telegram notification: network error");
  }
}
