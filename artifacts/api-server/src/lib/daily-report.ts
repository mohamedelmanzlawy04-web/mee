import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, usersTable } from "@workspace/db";
import { sql, eq, and, gte, lt, count, sum, isNull } from "drizzle-orm";
import type { DailyReportStats } from "./telegram";
import { logger } from "./logger";

/** Returns the start and end of today in Cairo timezone as UTC Date objects. */
function getCairoTodayBounds(): { start: Date; end: Date } {
  const now = new Date();

  // Get today's date string in Cairo time
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // "YYYY-MM-DD"

  // Build midnight Cairo time → UTC
  const cairoMidnight = new Date(`${parts}T00:00:00+02:00`);
  // Try EET (+2) first; DST shifts to EEST (+3) in summer.
  // Using a fixed +02:00 is slightly off in summer — acceptable for a daily report.
  const start = cairoMidnight;
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Get the current hour and minute in Cairo timezone. */
export function getCairoHourMinute(): { hour: number; minute: number; dateStr: string } {
  const now = new Date();
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) => p.find((x) => x.type === type)?.value ?? "0";
  return {
    hour: parseInt(get("hour"), 10),
    minute: parseInt(get("minute"), 10),
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/** Build daily stats for the Telegram report. */
export async function generateDailyStats(): Promise<DailyReportStats> {
  const { start, end } = getCairoTodayBounds();

  const [
    orderRows,
    cancelledCount,
    pendingCount,
    newCustomerCount,
    topProducts,
    lowStock,
  ] = await Promise.all([
    // All non-cancelled, non-deleted orders today
    db
      .select({
        userId: ordersTable.userId,
        total: ordersTable.total,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .where(
        and(
          isNull(ordersTable.deletedAt),
          gte(ordersTable.createdAt, start),
          lt(ordersTable.createdAt, end),
        ),
      ),

    // Cancelled orders today
    db
      .select({ c: count() })
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.status, "CANCELLED"),
          gte(ordersTable.createdAt, start),
          lt(ordersTable.createdAt, end),
          isNull(ordersTable.deletedAt),
        ),
      )
      .then((r) => r[0]?.c ?? 0),

    // Pending orders (all time)
    db
      .select({ c: count() })
      .from(ordersTable)
      .where(and(eq(ordersTable.status, "PENDING"), isNull(ordersTable.deletedAt)))
      .then((r) => r[0]?.c ?? 0),

    // New customers today
    db
      .select({ c: count() })
      .from(usersTable)
      .where(gte(usersTable.createdAt, start))
      .then((r) => r[0]?.c ?? 0),

    // Top selling products today (by quantity sold)
    db
      .select({
        title: productsTable.title,
        qty: sum(orderItemsTable.quantity).mapWith(Number),
      })
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
      .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(
        and(
          gte(ordersTable.createdAt, start),
          lt(ordersTable.createdAt, end),
          isNull(ordersTable.deletedAt),
        ),
      )
      .groupBy(productsTable.title)
      .orderBy(sql`sum(${orderItemsTable.quantity}) desc`)
      .limit(5),

    // Low stock: products where total available inventory < 5
    // Using a raw count from productVariants inventory
    db.execute(sql`
      SELECT p.title, COALESCE(SUM(i.quantity), 0)::int AS stock
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN inventory i ON i.variant_id = pv.id
      WHERE p.deleted_at IS NULL
      GROUP BY p.id, p.title
      HAVING COALESCE(SUM(i.quantity), 0) < 5
      ORDER BY stock ASC
      LIMIT 10
    `).then((r) => r.rows as { title: string; stock: number }[]),
  ]);

  const totalOrders = orderRows.length;
  const totalRevenue = orderRows.reduce((s, r) => s + Number(r.total), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Returning = ordered today AND had a prior order (userId exists and was registered before today)
  const orderingUserIds = new Set(orderRows.map((r) => r.userId).filter(Boolean) as string[]);
  let returningCustomers = 0;
  if (orderingUserIds.size > 0) {
    const priorOrders = await db
      .select({ userId: ordersTable.userId })
      .from(ordersTable)
      .where(
        and(
          isNull(ordersTable.deletedAt),
          lt(ordersTable.createdAt, start),
          sql`${ordersTable.userId} = ANY(ARRAY[${sql.raw(
            [...orderingUserIds].map((id) => `'${id}'`).join(","),
          )}]::text[])`,
        ),
      );
    returningCustomers = new Set(priorOrders.map((r) => r.userId)).size;
  }

  return {
    totalOrders,
    totalRevenue,
    avgOrderValue,
    newCustomers: newCustomerCount,
    returningCustomers,
    cancelledOrders: cancelledCount,
    pendingOrders: pendingCount,
    topProducts: topProducts.map((p) => ({ title: p.title, qty: p.qty ?? 0 })),
    lowStockProducts: lowStock,
  };
}
