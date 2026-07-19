import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable,
  orderItemsTable,
  expensesTable,
  employeesTable,
  adSpendsTable,
  productCostsTable,
  productsTable,
} from "@workspace/db";
import { eq, and, gte, lte, lt, isNull, sum, count, avg, sql, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

// ── Period helpers ──────────────────────────────────────────────

type Period = "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "custom";

function getPeriodRange(period: Period, from?: string, to?: string): { start: Date; end: Date } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (period) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case "week": {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      return { start: startOfDay(weekStart), end: endOfDay(now) };
    }
    case "month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end: endOfDay(now) };
    }
    case "quarter": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      return { start: new Date(now.getFullYear(), qMonth, 1), end: endOfDay(now) };
    }
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) };
    case "custom":
      return {
        start: from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1),
        end: to ? new Date(to) : endOfDay(now),
      };
  }
}

function getPrevPeriodRange(start: Date, end: Date): { start: Date; end: Date } {
  const duration = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(start.getTime() - 1),
  };
}

async function getRevenue(start: Date, end: Date): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${ordersTable.total}), 0)` })
    .from(ordersTable)
    .where(and(isNull(ordersTable.deletedAt), gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)));
  return Number(row?.total ?? 0);
}

async function getExpenseTotal(start: Date, end: Date): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${expensesTable.amount}), 0)` })
    .from(expensesTable)
    .where(and(isNull(expensesTable.deletedAt), gte(expensesTable.date, start), lte(expensesTable.date, end)));
  return Number(row?.total ?? 0);
}

async function getEmployeeMonthlyCost(): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${employeesTable.monthlySalary} + ${employeesTable.bonus} + ${employeesTable.commission}), 0)` })
    .from(employeesTable)
    .where(eq(employeesTable.isActive, true));
  return Number(row?.total ?? 0);
}

// GET /api/finance/overview
router.get("/finance/overview", requireAdmin, async (req, res) => {
  try {
    const period = (req.query.period as Period) ?? "month";
    const { start, end } = getPeriodRange(period, req.query.from as string, req.query.to as string);
    const prev = getPrevPeriodRange(start, end);

    const [revenue, prevRevenue, expenses, prevExpenses] = await Promise.all([
      getRevenue(start, end),
      getRevenue(prev.start, prev.end),
      getExpenseTotal(start, end),
      getExpenseTotal(prev.start, prev.end),
    ]);

    const employeeCost = await getEmployeeMonthlyCost();

    const [orderStats] = await db
      .select({
        orderCount: count(),
        avgOrder: sql<string>`coalesce(avg(${ordersTable.total}), 0)`,
        outstanding: sql<string>`coalesce(sum(case when ${ordersTable.status} = 'PENDING' then ${ordersTable.total} else 0 end), 0)`,
      })
      .from(ordersTable)
      .where(and(isNull(ordersTable.deletedAt), gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)));

    const totalExpenses = expenses + employeeCost;
    const grossProfit = revenue * 0.6; // approximate COGS as 40%
    const netProfit = revenue - totalExpenses;
    const prevNetProfit = prevRevenue - (prevExpenses + employeeCost);
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const expensesGrowth = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;
    const monthlyGrowth = prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : 0;

    res.json({
      totalRevenue: revenue,
      netRevenue: revenue * 0.97, // ~3% payment gateway fees
      grossProfit,
      netProfit,
      totalExpenses,
      profitMargin,
      monthlyGrowth,
      revenueGrowth,
      expensesGrowth,
      cashBalance: netProfit,
      outstandingPayments: Number(orderStats?.outstanding ?? 0),
      averageOrderValue: Number(orderStats?.avgOrder ?? 0),
      costPerOrder: orderStats?.orderCount ? totalExpenses / Number(orderStats.orderCount) : 0,
      prevRevenue,
      prevExpenses,
      prevNetProfit,
    });
  } catch (err) {
    req.log.error({ err }, "[GET /finance/overview]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/finance/pl
router.get("/finance/pl", requireAdmin, async (req, res) => {
  try {
    const period = (req.query.period as Period) ?? "month";
    const { start, end } = getPeriodRange(period, req.query.from as string, req.query.to as string);

    const revenue = await getRevenue(start, end);

    // Get expenses by category
    const expensesByCategory = await db
      .select({
        category: expensesTable.category,
        total: sql<string>`sum(${expensesTable.amount})`,
      })
      .from(expensesTable)
      .where(and(isNull(expensesTable.deletedAt), gte(expensesTable.date, start), lte(expensesTable.date, end)))
      .groupBy(expensesTable.category);

    const catMap: Record<string, number> = {};
    for (const row of expensesByCategory) {
      catMap[row.category] = Number(row.total);
    }

    const cogs =
      (catMap["MANUFACTURING"] ?? 0) +
      (catMap["PACKAGING"] ?? 0) +
      (catMap["SHIPPING"] ?? 0);

    const advertising =
      (catMap["META_ADS"] ?? 0) +
      (catMap["TIKTOK_ADS"] ?? 0) +
      (catMap["GOOGLE_ADS"] ?? 0) +
      (catMap["SNAPCHAT_ADS"] ?? 0) +
      (catMap["INFLUENCER_MARKETING"] ?? 0);

    const employeeCost = await getEmployeeMonthlyCost();
    const salaries = (catMap["EMPLOYEE_SALARIES"] ?? 0) + employeeCost;
    const otherOps = Object.entries(catMap)
      .filter(([k]) => !["MANUFACTURING", "PACKAGING", "SHIPPING", "META_ADS", "TIKTOK_ADS", "GOOGLE_ADS", "SNAPCHAT_ADS", "INFLUENCER_MARKETING", "EMPLOYEE_SALARIES"].includes(k))
      .reduce((s, [, v]) => s + v, 0);

    const grossProfit = revenue - cogs;
    const operatingExpenses = advertising + salaries + otherOps;
    const netProfit = grossProfit - operatingExpenses;

    const rows = [
      { label: "Revenue", amount: revenue, type: "revenue" as const },
      { label: "Manufacturing", amount: -(catMap["MANUFACTURING"] ?? 0), type: "cogs" as const },
      { label: "Packaging", amount: -(catMap["PACKAGING"] ?? 0), type: "cogs" as const },
      { label: "Shipping", amount: -(catMap["SHIPPING"] ?? 0), type: "cogs" as const },
      { label: "Gross Profit", amount: grossProfit, type: "total" as const },
      { label: "Meta Ads", amount: -(catMap["META_ADS"] ?? 0), type: "operating" as const },
      { label: "TikTok Ads", amount: -(catMap["TIKTOK_ADS"] ?? 0), type: "operating" as const },
      { label: "Google Ads", amount: -(catMap["GOOGLE_ADS"] ?? 0), type: "operating" as const },
      { label: "Influencer Marketing", amount: -(catMap["INFLUENCER_MARKETING"] ?? 0), type: "operating" as const },
      { label: "Employee Salaries", amount: -salaries, type: "operating" as const },
      { label: "Photography & Content", amount: -((catMap["PHOTOGRAPHY"] ?? 0) + (catMap["CONTENT_CREATION"] ?? 0)), type: "operating" as const },
      { label: "Software & Tools", amount: -(catMap["SOFTWARE"] ?? 0), type: "operating" as const },
      { label: "Office & Rent", amount: -((catMap["OFFICE"] ?? 0) + (catMap["RENT"] ?? 0)), type: "operating" as const },
      { label: "Freelancers", amount: -(catMap["FREELANCERS"] ?? 0), type: "operating" as const },
      { label: "Miscellaneous", amount: -(catMap["MISCELLANEOUS"] ?? 0), type: "operating" as const },
    ];

    res.json({
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      netProfit,
      period: period,
      rows,
    });
  } catch (err) {
    req.log.error({ err }, "[GET /finance/pl]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/finance/cashflow
router.get("/finance/cashflow", requireAdmin, async (req, res) => {
  try {
    // Last 12 months
    const now = new Date();
    const months: Array<{ month: string; moneyIn: number; moneyOut: number; netCashFlow: number }> = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const [moneyIn, moneyOut] = await Promise.all([
        getRevenue(start, end),
        getExpenseTotal(start, end),
      ]);

      months.push({
        month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        moneyIn,
        moneyOut,
        netCashFlow: moneyIn - moneyOut,
      });
    }

    const totalIn = months.reduce((s, m) => s + m.moneyIn, 0);
    const totalOut = months.reduce((s, m) => s + m.moneyOut, 0);

    res.json({
      moneyIn: totalIn,
      moneyOut: totalOut,
      netCashFlow: totalIn - totalOut,
      cashBalance: totalIn - totalOut,
      monthly: months,
    });
  } catch (err) {
    req.log.error({ err }, "[GET /finance/cashflow]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/finance/health
router.get("/finance/health", requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [thisRevenue, lastRevenue, thisExpenses, lastExpenses, employeeCost] = await Promise.all([
      getRevenue(thisMonthStart, now),
      getRevenue(lastMonthStart, lastMonthEnd),
      getExpenseTotal(thisMonthStart, now),
      getExpenseTotal(lastMonthStart, lastMonthEnd),
      getEmployeeMonthlyCost(),
    ]);

    const totalExpenses = thisExpenses + employeeCost;
    const netProfit = thisRevenue - totalExpenses;
    const netMargin = thisRevenue > 0 ? (netProfit / thisRevenue) * 100 : 0;
    const burnRate = totalExpenses;
    const breakEvenPoint = netMargin !== 0 ? totalExpenses / Math.max(netMargin / 100, 0.01) : totalExpenses;
    const revenueGrowth = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    const expenseGrowth = lastExpenses > 0 ? ((thisExpenses - lastExpenses) / lastExpenses) * 100 : 0;

    let explanation: string | null = null;
    if (netProfit < 0) {
      const reasons = [];
      if (totalExpenses > thisRevenue) reasons.push("expenses exceed revenue");
      if (expenseGrowth > 20) reasons.push("expenses grew rapidly this month");
      if (revenueGrowth < -10) reasons.push("revenue declined significantly");
      explanation = reasons.length > 0 ? `Loss driven by: ${reasons.join(", ")}.` : "Revenue is insufficient to cover operating costs.";
    }

    res.json({
      isProfitable: netProfit > 0,
      netMargin,
      burnRate,
      breakEvenPoint,
      revenueGrowth,
      expenseGrowth,
      monthlyProfit: netProfit,
      explanation,
    });
  } catch (err) {
    req.log.error({ err }, "[GET /finance/health]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/finance/insights
router.get("/finance/insights", requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [revenue, prevRevenue, expenses, prevExpenses, employeeCost] = await Promise.all([
      getRevenue(start, now),
      getRevenue(prevStart, prevEnd),
      getExpenseTotal(start, now),
      getExpenseTotal(prevStart, prevEnd),
      getEmployeeMonthlyCost(),
    ]);

    const totalExpenses = expenses + employeeCost;
    const netProfit = revenue - totalExpenses;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const expenseGrowth = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

    // Category breakdown
    const catRows = await db
      .select({ category: expensesTable.category, total: sql<string>`sum(${expensesTable.amount})` })
      .from(expensesTable)
      .where(and(isNull(expensesTable.deletedAt), gte(expensesTable.date, start)))
      .groupBy(expensesTable.category);

    const insights: Array<{ type: "positive" | "negative" | "warning" | "neutral"; message: string; priority: number }> = [];

    if (netProfit > 0) {
      insights.push({ type: "positive", message: `Your business is profitable this month with a ${netMargin.toFixed(1)}% net margin.`, priority: 1 });
    } else {
      insights.push({ type: "negative", message: `Your business is running at a loss of EGP ${Math.abs(netProfit).toLocaleString()} this month.`, priority: 1 });
    }

    if (revenueGrowth > 0) {
      insights.push({ type: "positive", message: `Revenue increased ${revenueGrowth.toFixed(1)}% compared to last month.`, priority: 2 });
    } else if (revenueGrowth < -5) {
      insights.push({ type: "negative", message: `Revenue declined ${Math.abs(revenueGrowth).toFixed(1)}% compared to last month.`, priority: 2 });
    }

    if (expenseGrowth > 15) {
      insights.push({ type: "warning", message: `Expenses increased ${expenseGrowth.toFixed(1)}% compared to last month — review your cost structure.`, priority: 3 });
    }

    for (const row of catRows) {
      const pct = revenue > 0 ? (Number(row.total) / revenue) * 100 : 0;
      if (row.category === "META_ADS" && pct > 30) {
        insights.push({ type: "warning", message: `Meta Ads spending is ${pct.toFixed(0)}% of revenue — consider diversifying your ad spend.`, priority: 4 });
      }
      if (row.category === "PACKAGING" && Number(row.total) > revenue * 0.1) {
        insights.push({ type: "warning", message: `Packaging expenses are higher than average at ${pct.toFixed(0)}% of revenue.`, priority: 5 });
      }
    }

    if (netMargin > 20) {
      insights.push({ type: "positive", message: `Your net profit margin of ${netMargin.toFixed(1)}% is healthy. Most profitable brands target 15–25%.`, priority: 6 });
    }

    if (employeeCost > revenue * 0.4) {
      insights.push({ type: "warning", message: `Employee costs represent ${((employeeCost / revenue) * 100).toFixed(0)}% of revenue — consider optimizing headcount or increasing sales.`, priority: 7 });
    }

    if (insights.length < 3) {
      insights.push({ type: "neutral", message: "Add expenses and track ad spends to unlock deeper financial insights.", priority: 10 });
    }

    res.json(insights.sort((a, b) => a.priority - b.priority));
  } catch (err) {
    req.log.error({ err }, "[GET /finance/insights]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/finance/product-profitability
router.get("/finance/product-profitability", requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const salesByProduct = await db
      .select({
        productId: orderItemsTable.productId,
        productTitle: orderItemsTable.productTitle,
        revenue: sql<string>`sum(${orderItemsTable.totalPrice})`,
        unitsSold: sql<string>`sum(${orderItemsTable.quantity})`,
      })
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
      .where(and(isNull(ordersTable.deletedAt), gte(ordersTable.createdAt, start)))
      .groupBy(orderItemsTable.productId, orderItemsTable.productTitle);

    const costs = await db.select().from(productCostsTable);
    const costMap: Record<string, typeof costs[0]> = {};
    for (const c of costs) costMap[c.productId] = c;

    const result = salesByProduct.map((row) => {
      const cost = costMap[row.productId] ?? null;
      const revenue = Number(row.revenue);
      const productCost = Number(cost?.manufacturingCost ?? 0);
      const packagingCost = Number(cost?.packagingCost ?? 0);
      const shippingCost = Number(cost?.shippingCost ?? 0);
      const advertisingAllocation = Number(cost?.advertisingAllocation ?? 0);
      const totalCost = productCost + packagingCost + shippingCost + advertisingAllocation;
      const profit = revenue - totalCost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      return {
        productId: row.productId,
        productTitle: row.productTitle,
        revenue,
        productCost,
        packagingCost,
        shippingCost,
        advertisingAllocation,
        profit,
        margin,
        unitsSold: Number(row.unitsSold),
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "[GET /finance/product-profitability]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/finance/ad-analytics
router.get("/finance/ad-analytics", requireAdmin, async (req, res) => {
  try {
    const period = (req.query.period as Period) ?? "month";
    const { start, end } = getPeriodRange(period);

    const rows = await db
      .select({
        platform: adSpendsTable.platform,
        spend: sql<string>`sum(${adSpendsTable.amount})`,
        revenue: sql<string>`sum(${adSpendsTable.revenue})`,
        impressions: sql<string>`sum(${adSpendsTable.impressions})`,
        clicks: sql<string>`sum(${adSpendsTable.clicks})`,
        conversions: sql<string>`sum(${adSpendsTable.conversions})`,
      })
      .from(adSpendsTable)
      .where(and(gte(adSpendsTable.date, start), lte(adSpendsTable.date, end)))
      .groupBy(adSpendsTable.platform);

    const result = rows.map((row) => {
      const spend = Number(row.spend);
      const revenue = Number(row.revenue);
      const conversions = Number(row.conversions ?? 0);
      return {
        platform: row.platform,
        spend,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        cac: conversions > 0 ? spend / conversions : 0,
        profitAfterAds: revenue - spend,
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        conversions,
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "[GET /finance/ad-analytics]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
