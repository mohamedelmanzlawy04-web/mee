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
