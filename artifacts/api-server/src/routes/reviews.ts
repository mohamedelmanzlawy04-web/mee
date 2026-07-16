import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const param = (p: string | string[]): string => (Array.isArray(p) ? p[0] : p);

const router = Router();

const ListQuerySchema = z.object({
  productId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
});

const ReviewInputSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().optional(),
});

const ReviewUpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

// GET /api/reviews
router.get("/reviews", async (req, res) => {
  const result = ListQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { productId, page, pageSize } = result.data;
  const offset = (page - 1) * pageSize;

  try {
    const conditions = [eq(reviewsTable.status, "APPROVED")];
    if (productId) conditions.push(eq(reviewsTable.productId, productId));
    const where = and(...conditions);

    const [data, [{ total }]] = await Promise.all([
      db
        .select({
          id: reviewsTable.id,
          productId: reviewsTable.productId,
          userId: reviewsTable.userId,
          rating: reviewsTable.rating,
          title: reviewsTable.title,
          body: reviewsTable.body,
          status: reviewsTable.status,
          createdAt: reviewsTable.createdAt,
          reviewerName: usersTable.fullName,
        })
        .from(reviewsTable)
        .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
        .where(where)
        .orderBy(desc(reviewsTable.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ total: count() }).from(reviewsTable).where(where),
    ]);

    res.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    req.log.error({ err }, "[GET /reviews]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reviews
router.post("/reviews", requireAuth, async (req, res) => {
  const result = ReviewInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const [review] = await db
      .insert(reviewsTable)
      .values({ ...result.data, userId: req.user!.id })
      .returning();

    res.status(201).json(review);
  } catch (err) {
    req.log.error({ err }, "[POST /reviews]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reviews/:id
router.get("/reviews/:id", async (req, res) => {
  try {
    const [review] = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, param(req.params.id)))
      .limit(1);

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    res.json(review);
  } catch (err) {
    req.log.error({ err }, "[GET /reviews/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/reviews/:id
router.patch("/reviews/:id", requireAdmin, async (req, res) => {
  const result = ReviewUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  try {
    const [review] = await db
      .update(reviewsTable)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(reviewsTable.id, param(req.params.id)))
      .returning();

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    res.json(review);
  } catch (err) {
    req.log.error({ err }, "[PATCH /reviews/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/reviews/:id
router.delete("/reviews/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(reviewsTable).where(eq(reviewsTable.id, param(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /reviews/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
