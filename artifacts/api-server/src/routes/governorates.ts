import { Router } from "express";
import { db } from "@workspace/db";
import { governoratesTable, citiesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

const GovernorateInputSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional().nullable(),
  shippingPrice: z.number().min(0),
  estimatedDays: z.number().int().min(1),
  isActive: z.boolean().optional().default(true),
});

const CityInputSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional().nullable(),
});

// GET /api/governorates — public, active only with their cities
router.get("/governorates", async (req, res) => {
  try {
    const isAdmin = (req as any).user?.role === "ADMIN";
    const govs = await db
      .select()
      .from(governoratesTable)
      .where(isAdmin ? undefined : eq(governoratesTable.isActive, true))
      .orderBy(asc(governoratesTable.name));

    const cities = await db
      .select()
      .from(citiesTable)
      .orderBy(asc(citiesTable.name));

    const result = govs.map((g) => ({
      ...g,
      cities: cities.filter((c) => c.governorateId === g.id),
    }));

    res.json(result);
  } catch (err) {
    (req as any).log?.error({ err }, "[GET /governorates]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/governorates/:id — single governorate with cities
router.get("/governorates/:id", async (req, res) => {
  try {
    const [gov] = await db
      .select()
      .from(governoratesTable)
      .where(eq(governoratesTable.id, req.params.id))
      .limit(1);

    if (!gov) {
      res.status(404).json({ error: "Governorate not found" });
      return;
    }

    const cities = await db
      .select()
      .from(citiesTable)
      .where(eq(citiesTable.governorateId, gov.id))
      .orderBy(asc(citiesTable.name));

    res.json({ ...gov, cities });
  } catch (err) {
    (req as any).log?.error({ err }, "[GET /governorates/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/governorates — admin
router.post("/governorates", requireAdmin, async (req, res) => {
  const result = GovernorateInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const [gov] = await db
      .insert(governoratesTable)
      .values({
        name: result.data.name,
        nameAr: result.data.nameAr ?? null,
        shippingPrice: String(result.data.shippingPrice),
        estimatedDays: result.data.estimatedDays,
        isActive: result.data.isActive,
      })
      .returning();

    res.status(201).json({ ...gov, cities: [] });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Governorate name already exists" });
      return;
    }
    (req as any).log?.error({ err }, "[POST /governorates]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/governorates/:id — admin
router.patch("/governorates/:id", requireAdmin, async (req, res) => {
  const result = GovernorateInputSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (result.data.name !== undefined) updates.name = result.data.name;
    if (result.data.nameAr !== undefined) updates.nameAr = result.data.nameAr;
    if (result.data.shippingPrice !== undefined) updates.shippingPrice = String(result.data.shippingPrice);
    if (result.data.estimatedDays !== undefined) updates.estimatedDays = result.data.estimatedDays;
    if (result.data.isActive !== undefined) updates.isActive = result.data.isActive;

    const [gov] = await db
      .update(governoratesTable)
      .set(updates)
      .where(eq(governoratesTable.id, req.params.id))
      .returning();

    if (!gov) {
      res.status(404).json({ error: "Governorate not found" });
      return;
    }

    const cities = await db
      .select()
      .from(citiesTable)
      .where(eq(citiesTable.governorateId, gov.id))
      .orderBy(asc(citiesTable.name));

    res.json({ ...gov, cities });
  } catch (err) {
    (req as any).log?.error({ err }, "[PATCH /governorates/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/governorates/:id — admin
router.delete("/governorates/:id", requireAdmin, async (req, res) => {
  try {
    const [gov] = await db
      .delete(governoratesTable)
      .where(eq(governoratesTable.id, req.params.id))
      .returning();

    if (!gov) {
      res.status(404).json({ error: "Governorate not found" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    (req as any).log?.error({ err }, "[DELETE /governorates/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/governorates/:id/cities — admin
router.post("/governorates/:id/cities", requireAdmin, async (req, res) => {
  const result = CityInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const [gov] = await db
      .select({ id: governoratesTable.id })
      .from(governoratesTable)
      .where(eq(governoratesTable.id, req.params.id))
      .limit(1);

    if (!gov) {
      res.status(404).json({ error: "Governorate not found" });
      return;
    }

    const [city] = await db
      .insert(citiesTable)
      .values({
        governorateId: req.params.id,
        name: result.data.name,
        nameAr: result.data.nameAr ?? null,
      })
      .returning();

    res.status(201).json(city);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "City name already exists in this governorate" });
      return;
    }
    (req as any).log?.error({ err }, "[POST /governorates/:id/cities]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/governorates/:id/cities/:cityId — admin
router.patch("/governorates/:id/cities/:cityId", requireAdmin, async (req, res) => {
  const result = CityInputSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (result.data.name !== undefined) updates.name = result.data.name;
    if (result.data.nameAr !== undefined) updates.nameAr = result.data.nameAr;

    const [city] = await db
      .update(citiesTable)
      .set(updates)
      .where(eq(citiesTable.id, req.params.cityId))
      .returning();

    if (!city) {
      res.status(404).json({ error: "City not found" });
      return;
    }

    res.json(city);
  } catch (err) {
    (req as any).log?.error({ err }, "[PATCH /governorates/:id/cities/:cityId]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/governorates/:id/cities/:cityId — admin
router.delete("/governorates/:id/cities/:cityId", requireAdmin, async (req, res) => {
  try {
    const [city] = await db
      .delete(citiesTable)
      .where(eq(citiesTable.id, req.params.cityId))
      .returning();

    if (!city) {
      res.status(404).json({ error: "City not found" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    (req as any).log?.error({ err }, "[DELETE /governorates/:id/cities/:cityId]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
