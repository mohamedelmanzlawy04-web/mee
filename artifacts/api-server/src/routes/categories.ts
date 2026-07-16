import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const param = (p: string | string[]): string => (Array.isArray(p) ? p[0] : p);

const router = Router();

const CategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// GET /api/categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.isActive, true))
      .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));

    res.json(categories);
  } catch (err) {
    req.log.error({ err }, "[GET /categories]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/categories
router.post("/categories", requireAdmin, async (req, res) => {
  const result = CategorySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const [category] = await db.insert(categoriesTable).values(result.data).returning();
    res.status(201).json(category);
  } catch (err) {
    req.log.error({ err }, "[POST /categories]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/categories/:id
router.get("/categories/:id", async (req, res) => {
  try {
    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, param(req.params.id)))
      .limit(1);

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    res.json(category);
  } catch (err) {
    req.log.error({ err }, "[GET /categories/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/categories/:id
router.patch("/categories/:id", requireAdmin, async (req, res) => {
  const result = CategorySchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  try {
    const [existing] = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, param(req.params.id)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const [category] = await db
      .update(categoriesTable)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(categoriesTable.id, param(req.params.id)))
      .returning();

    res.json(category);
  } catch (err) {
    req.log.error({ err }, "[PATCH /categories/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/categories/:id
router.delete("/categories/:id", requireAdmin, async (req, res) => {
  try {
    await db
      .update(categoriesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(categoriesTable.id, param(req.params.id)));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /categories/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
