import { Router } from "express";
import { db } from "@workspace/db";
import { newsletterSubscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const NewsletterInputSchema = z.object({
  email: z.string().email(),
});

// POST /api/newsletter
router.post("/newsletter", async (req, res) => {
  const result = NewsletterInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const { email } = result.data;

  try {
    const [existing] = await db
      .select()
      .from(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.email, email))
      .limit(1);

    if (existing) {
      if (existing.isActive) {
        res.json({ subscribed: true, message: "Already subscribed" });
        return;
      }

      await db
        .update(newsletterSubscribersTable)
        .set({ isActive: true, unsubscribedAt: null })
        .where(eq(newsletterSubscribersTable.email, email));

      res.json({ subscribed: true, message: "Resubscribed successfully" });
      return;
    }

    await db.insert(newsletterSubscribersTable).values({ email });
    res.json({ subscribed: true, message: "Subscribed successfully" });
  } catch (err) {
    req.log.error({ err }, "[POST /newsletter]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
