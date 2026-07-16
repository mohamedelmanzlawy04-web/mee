import { Router } from "express";
import { db } from "@workspace/db";
import { collectionsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const param = (p: string | string[]): string => (Array.isArray(p) ? p[0] : p);

const router = Router();

const CollectionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// GET /api/collections
router.get("/collections", async (req, res) => {
  try {
    const collections = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.isActive, true))
      .orderBy(asc(collectionsTable.sortOrder), asc(collectionsTable.name));

    res.json(collections);
  } catch (err) {
    req.log.error({ err }, "[GET /collections]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/collections
router.post("/collections", requireAdmin, async (req, res) => {
  const result = CollectionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const [collection] = await db.insert(collectionsTable).values(result.data).returning();
    res.status(201).json(collection);
  } catch (err) {
    req.log.error({ err }, "[POST /collections]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/collections/:id
router.get("/collections/:id", async (req, res) => {
  try {
    const [collection] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, param(req.params.id)))
      .limit(1);

    if (!collection) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }

    res.json(collection);
  } catch (err) {
    req.log.error({ err }, "[GET /collections/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/collections/:id
router.patch("/collections/:id", requireAdmin, async (req, res) => {
  const result = CollectionSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  try {
    const [collection] = await db
      .update(collectionsTable)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(collectionsTable.id, param(req.params.id)))
      .returning();

    if (!collection) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }

    res.json(collection);
  } catch (err) {
    req.log.error({ err }, "[PATCH /collections/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/collections/:id
router.delete("/collections/:id", requireAdmin, async (req, res) => {
  try {
    await db
      .update(collectionsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(collectionsTable.id, param(req.params.id)));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /collections/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
