import { Router } from "express";
import { db } from "@workspace/db";
import { contactMessagesTable } from "@workspace/db";
import { z } from "zod";

const router = Router();

const ContactInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

// POST /api/contact
router.post("/contact", async (req, res) => {
  const result = ContactInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    await db.insert(contactMessagesTable).values(result.data);
    res.json({ received: true, message: "Your message has been received. We will get back to you shortly." });
  } catch (err) {
    req.log.error({ err }, "[POST /contact]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
