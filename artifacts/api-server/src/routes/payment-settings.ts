import { Router } from "express";
import { db } from "@workspace/db";
import { paymentSettingsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

const PaymentSettingsInputSchema = z.object({
  codEnabled: z.boolean().optional(),
  instapayEnabled: z.boolean().optional(),
  ewalletEnabled: z.boolean().optional(),
  instapayNumber: z.string().optional(),
  ewalletNumber: z.string().optional(),
  accountName: z.string().optional(),
  instapayInstructions: z.string().optional(),
  ewalletInstructions: z.string().optional(),
});

async function getOrCreateSettings() {
  const existing = await db.select().from(paymentSettingsTable).limit(1);
  if (existing.length > 0) return existing[0];

  const [created] = await db
    .insert(paymentSettingsTable)
    .values({
      id: crypto.randomUUID(),
      instapayNumber: "01030076090",
      ewalletNumber: "01030076090",
      accountName: "STRESSNES",
      instapayInstructions:
        "Transfer the total amount to the number above, then upload a screenshot of the payment.",
      ewalletInstructions:
        "Transfer the total amount to the wallet above, then upload a screenshot of the payment.",
    })
    .returning();
  return created;
}

// GET /api/payment-settings (public — needed at checkout)
router.get("/payment-settings", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    req.log.error({ err }, "[GET /payment-settings]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/payment-settings (admin only)
router.put("/payment-settings", requireAdmin, async (req, res) => {
  const result = PaymentSettingsInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const current = await getOrCreateSettings();
    const [updated] = await db
      .update(paymentSettingsTable)
      .set({ ...result.data, updatedAt: new Date() })
      .where(
        (await import("drizzle-orm")).eq(paymentSettingsTable.id, current.id)
      )
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "[PUT /payment-settings]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
