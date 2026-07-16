import { Router } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  productImagesTable,
  productVariantsTable,
  categoriesTable,
  collectionsTable,
} from "@workspace/db";
import { eq, and, isNull, like, gte, lte, desc, asc, count } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const param = (p: string | string[]): string => (Array.isArray(p) ? p[0] : p);

const router = Router();

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(24),
  search: z.string().max(200).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  categoryId: z.string().optional(),
  collectionId: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sortBy: z.enum(["price", "createdAt", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const ProductInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  sku: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  categoryId: z.string().optional(),
  collectionId: z.string().optional(),
});

// GET /api/products
router.get("/products", async (req, res) => {
  const result = ListQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { page, pageSize, search, status, categoryId, collectionId, featured, published, minPrice, maxPrice, sortBy, sortOrder } = result.data;
  const offset = (page - 1) * pageSize;

  try {
    const conditions = [isNull(productsTable.deletedAt)];
    if (status) conditions.push(eq(productsTable.status, status));
    if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
    if (collectionId) conditions.push(eq(productsTable.collectionId, collectionId));
    if (featured !== undefined) conditions.push(eq(productsTable.featured, featured));
    if (published !== undefined) conditions.push(eq(productsTable.published, published));
    if (search) conditions.push(like(productsTable.title, `%${search}%`));
    if (minPrice) conditions.push(gte(productsTable.price, String(minPrice)));
    if (maxPrice) conditions.push(lte(productsTable.price, String(maxPrice)));

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];
    const orderFn = sortOrder === "asc" ? asc : desc;
    const orderCol = sortBy === "title" ? productsTable.title : sortBy === "price" ? productsTable.price : productsTable.createdAt;

    const [data, [{ total }]] = await Promise.all([
      db
        .select({
          id: productsTable.id,
          title: productsTable.title,
          slug: productsTable.slug,
          sku: productsTable.sku,
          price: productsTable.price,
          comparePrice: productsTable.comparePrice,
          status: productsTable.status,
          featured: productsTable.featured,
          published: productsTable.published,
          createdAt: productsTable.createdAt,
          categoryId: productsTable.categoryId,
          collectionId: productsTable.collectionId,
        })
        .from(productsTable)
        .where(where)
        .orderBy(orderFn(orderCol))
        .limit(pageSize)
        .offset(offset),
      db.select({ total: count() }).from(productsTable).where(where),
    ]);

    res.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    req.log.error({ err }, "[GET /products]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/products/:slug
router.get("/products/:slug", async (req, res) => {
  try {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.slug, param(req.params.slug)), isNull(productsTable.deletedAt)))
      .limit(1);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [images, variants, category, collection] = await Promise.all([
      db.select().from(productImagesTable).where(eq(productImagesTable.productId, product.id)),
      db.select().from(productVariantsTable).where(and(eq(productVariantsTable.productId, product.id), eq(productVariantsTable.isActive, true))),
      product.categoryId ? db.select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId)).limit(1) : Promise.resolve([]),
      product.collectionId ? db.select({ id: collectionsTable.id, name: collectionsTable.name, slug: collectionsTable.slug }).from(collectionsTable).where(eq(collectionsTable.id, product.collectionId)).limit(1) : Promise.resolve([]),
    ]);

    res.json({ ...product, images, variants, category: category[0] ?? null, collection: collection[0] ?? null });
  } catch (err) {
    req.log.error({ err }, "[GET /products/:slug]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/products
router.post("/products", requireAdmin, async (req, res) => {
  const result = ProductInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const slug = result.data.slug ?? result.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const [product] = await db
      .insert(productsTable)
      .values({ ...result.data, slug, price: String(result.data.price), comparePrice: result.data.comparePrice ? String(result.data.comparePrice) : null, costPrice: result.data.costPrice ? String(result.data.costPrice) : null })
      .returning();

    res.status(201).json(product);
  } catch (err) {
    req.log.error({ err }, "[POST /products]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/products/:slug
router.patch("/products/:slug", requireAdmin, async (req, res) => {
  const result = ProductInputSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  try {
    const [existing] = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(and(eq(productsTable.slug, param(req.params.slug)), isNull(productsTable.deletedAt)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const updateData: Record<string, unknown> = { ...result.data, updatedAt: new Date() };
    if (result.data.price !== undefined) updateData.price = String(result.data.price);
    if (result.data.comparePrice !== undefined) updateData.comparePrice = String(result.data.comparePrice);

    const [product] = await db
      .update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, existing.id))
      .returning();

    res.json(product);
  } catch (err) {
    req.log.error({ err }, "[PATCH /products/:slug]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/products/:slug
router.delete("/products/:slug", requireAdmin, async (req, res) => {
  try {
    const [existing] = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(and(eq(productsTable.slug, param(req.params.slug)), isNull(productsTable.deletedAt)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await db
      .update(productsTable)
      .set({ deletedAt: new Date() })
      .where(eq(productsTable.id, existing.id));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /products/:slug]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
