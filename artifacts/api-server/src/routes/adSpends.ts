import { Router } from "express";
import { db } from "@workspace/db";
import { adSpendsTable, productCostsTable } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const router = Router();
const param = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

const AdSpendInputSchema = z.object({
  platform: z.enum(["META", "TIKTOK", "GOOGLE", "SNAPCHAT", "OTHER"]),
  amount: z.number().nonnegative(),
  revenue: z.number().nonnegative().optional().default(0),
  impressions: z.number().int().optional(),
  clicks: z.number().int().optional(),
  conversions: z.number().int().optional(),
  date: z.string().transform((v) => new Date(v)),
  notes: z.string().optional(),
});

const AdSpendUpdateSchema = AdSpendInputSchema.partial();

const ProductCostInputSchema = z.object({
  productId: z.string(),
  manufacturingCost: z.number().nonnegative().optional().default(0),
  packagingCost: z.number().nonnegative().optional().default(0),
  shippingCost: z.number().nonnegative().optional().default(0),
  advertisingAllocation: z.number().nonnegative().optional().default(0),
});

function fmt(e: typeof adSpendsTable.$inferSelect) {
  return { ...e, amount: Number(e.amount), revenue: Number(e.revenue) };
}

// GET /api/ad-spends
router.get("/ad-spends", requireAdmin, async (req, res) => {
  try {
    const conditions: any[] = [];
    if (req.query.platform) conditions.push(eq(adSpendsTable.platform, req.query.platform as any));
    if (req.query.from) conditions.push(gte(adSpendsTable.date, new Date(req.query.from as string)));
    if (req.query.to) conditions.push(lte(adSpendsTable.date, new Date(req.query.to as string)));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select().from(adSpendsTable).where(where).orderBy(desc(adSpendsTable.date));
    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error({ err }, "[GET /ad-spends]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ad-spends
router.post("/ad-spends", requireAdmin, async (req, res) => {
  const parsed = AdSpendInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error", details: parsed.error.format() }); return; }
  try {
    const [row] = await db.insert(adSpendsTable).values({
      ...parsed.data,
      amount: String(parsed.data.amount),
      revenue: String(parsed.data.revenue),
    }).returning();
    res.status(201).json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "[POST /ad-spends]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/ad-spends/:id
router.patch("/ad-spends/:id", requireAdmin, async (req, res) => {
  const parsed = AdSpendUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error" }); return; }
  try {
    const updates: Record<string, any> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.amount !== undefined) updates.amount = String(parsed.data.amount);
    if (parsed.data.revenue !== undefined) updates.revenue = String(parsed.data.revenue);
    const [row] = await db.update(adSpendsTable).set(updates).where(eq(adSpendsTable.id, param(req.params.id))).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "[PATCH /ad-spends/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/ad-spends/:id
router.delete("/ad-spends/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(adSpendsTable).where(eq(adSpendsTable.id, param(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /ad-spends/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/product-costs
router.get("/product-costs", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(productCostsTable);
    res.json(rows.map((r) => ({
      ...r,
      manufacturingCost: Number(r.manufacturingCost),
      packagingCost: Number(r.packagingCost),
      shippingCost: Number(r.shippingCost),
      advertisingAllocation: Number(r.advertisingAllocation),
    })));
  } catch (err) {
    req.log.error({ err }, "[GET /product-costs]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/product-costs (upsert)
router.post("/product-costs", requireAdmin, async (req, res) => {
  const parsed = ProductCostInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error" }); return; }
  try {
    const values = {
      productId: parsed.data.productId,
      manufacturingCost: String(parsed.data.manufacturingCost),
      packagingCost: String(parsed.data.packagingCost),
      shippingCost: String(parsed.data.shippingCost),
      advertisingAllocation: String(parsed.data.advertisingAllocation),
      updatedAt: new Date(),
    };
    const [row] = await db
      .insert(productCostsTable)
      .values({ id: crypto.randomUUID(), ...values })
      .onConflictDoUpdate({ target: productCostsTable.productId, set: values })
      .returning();
    res.json({
      ...row,
      manufacturingCost: Number(row.manufacturingCost),
      packagingCost: Number(row.packagingCost),
      shippingCost: Number(row.shippingCost),
      advertisingAllocation: Number(row.advertisingAllocation),
    });
  } catch (err) {
    req.log.error({ err }, "[POST /product-costs]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
