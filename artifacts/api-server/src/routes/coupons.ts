import { Router } from "express";
import { db } from "@workspace/db";
import { couponsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

const ValidateSchema = z.object({
  code: z.string(),
  orderAmount: z.number().positive(),
});

const CouponInputSchema = z.object({
  code: z.string().min(1),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.number().positive(),
  minOrderAmount: z.number().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  expiresAt: z.string().datetime().nullable().optional(),
});

// GET /api/coupons
router.get("/coupons", requireAdmin, async (req, res) => {
  try {
    const coupons = await db.select().from(couponsTable);
    res.json(coupons);
  } catch (err) {
    req.log.error({ err }, "[GET /coupons]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coupons
router.post("/coupons", requireAdmin, async (req, res) => {
  const result = CouponInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const data = result.data;
    const [coupon] = await db
      .insert(couponsTable)
      .values({
        code: data.code.toUpperCase(),
        type: data.type,
        value: String(data.value),
        minOrderAmount: data.minOrderAmount != null ? String(data.minOrderAmount) : null,
        maxUses: data.maxUses ?? null,
        isActive: data.isActive ?? true,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .returning();

    res.status(201).json(coupon);
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code === "23505") {
      res.status(409).json({ error: "A coupon with that code already exists" });
      return;
    }
    req.log.error({ err }, "[POST /coupons]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/coupons/:id
router.delete("/coupons/:id", requireAdmin, async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const [deleted] = await db
      .delete(couponsTable)
      .where(eq(couponsTable.id, id))
      .returning({ id: couponsTable.id });

    if (!deleted) {
      res.status(404).json({ error: "Coupon not found" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /coupons/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coupons/validate
router.post("/coupons/validate", async (req, res) => {
  const result = ValidateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const { code, orderAmount } = result.data;

  try {
    const [coupon] = await db
      .select()
      .from(couponsTable)
      .where(eq(couponsTable.code, code.toUpperCase()))
      .limit(1);

    if (!coupon) {
      res.json({ valid: false, message: "Coupon not found" });
      return;
    }

    if (!coupon.isActive) {
      res.json({ valid: false, message: "Coupon is inactive" });
      return;
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.json({ valid: false, message: "Coupon has expired" });
      return;
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      res.json({ valid: false, message: "Coupon usage limit reached" });
      return;
    }

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      res.json({ valid: false, message: `Minimum order amount is ${coupon.minOrderAmount}` });
      return;
    }

    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (orderAmount * Number(coupon.value)) / 100;
    } else {
      discountAmount = Math.min(Number(coupon.value), orderAmount);
    }

    res.json({ valid: true, coupon, discountAmount });
  } catch (err) {
    req.log.error({ err }, "[POST /coupons/validate]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
