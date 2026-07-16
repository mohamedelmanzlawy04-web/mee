import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryTable, inventoryHistoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const param = (p: string | string[]): string => (Array.isArray(p) ? p[0] : p);

const router = Router();

const UpdateSchema = z.object({
  change: z.number().int(),
  reason: z.enum(["PURCHASE", "RETURN", "ADJUSTMENT", "RESERVATION", "RELEASE", "DAMAGE", "RESTOCK"]),
  note: z.string().optional(),
});

// GET /api/inventory/:variantId
router.get("/inventory/:variantId", async (req, res) => {
  try {
    const [inv] = await db
      .select()
      .from(inventoryTable)
      .where(eq(inventoryTable.variantId, param(req.params.variantId)))
      .limit(1);

    if (!inv) {
      res.status(404).json({ error: "Inventory record not found" });
      return;
    }

    res.json({
      variantId: inv.variantId,
      stockQty: inv.stockQty,
      lowStockThreshold: inv.lowStockThreshold,
      isLowStock: inv.stockQty <= inv.lowStockThreshold,
      lastUpdated: inv.updatedAt,
    });
  } catch (err) {
    req.log.error({ err }, "[GET /inventory/:variantId]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/inventory/:variantId
router.patch("/inventory/:variantId", requireAdmin, async (req, res) => {
  const result = UpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const { change, reason, note } = result.data;

  try {
    const [existing] = await db
      .select()
      .from(inventoryTable)
      .where(eq(inventoryTable.variantId, param(req.params.variantId)))
      .limit(1);

    const currentQty = existing?.stockQty ?? 0;
    const newQty = Math.max(0, currentQty + change);

    let inv;
    if (existing) {
      const [updated] = await db
        .update(inventoryTable)
        .set({ stockQty: newQty, updatedAt: new Date() })
        .where(eq(inventoryTable.variantId, param(req.params.variantId)))
        .returning();
      inv = updated;
    } else {
      const [created] = await db
        .insert(inventoryTable)
        .values({ variantId: param(req.params.variantId), stockQty: newQty })
        .returning();
      inv = created;
    }

    // Record history
    await db.insert(inventoryHistoryTable).values({
      variantId: param(req.params.variantId),
      change,
      reason,
      note: note ?? null,
    });

    res.json({
      variantId: inv.variantId,
      stockQty: inv.stockQty,
      lowStockThreshold: inv.lowStockThreshold,
      isLowStock: inv.stockQty <= inv.lowStockThreshold,
      lastUpdated: inv.updatedAt,
    });
  } catch (err) {
    req.log.error({ err }, "[PATCH /inventory/:variantId]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
