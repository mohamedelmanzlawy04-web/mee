import { Router } from "express";
import { db } from "@workspace/db";
import { employeesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const router = Router();
const param = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

const EmployeeInputSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  monthlySalary: z.number().nonnegative(),
  bonus: z.number().nonnegative().optional().default(0),
  commission: z.number().nonnegative().optional().default(0),
  paymentStatus: z.enum(["PAID", "PENDING", "PARTIAL"]).optional().default("PENDING"),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

const EmployeeUpdateSchema = EmployeeInputSchema.partial();

function fmt(e: typeof employeesTable.$inferSelect) {
  return {
    ...e,
    monthlySalary: Number(e.monthlySalary),
    bonus: Number(e.bonus),
    commission: Number(e.commission),
  };
}

// GET /api/employees
router.get("/employees", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(employeesTable).orderBy(desc(employeesTable.createdAt));
    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error({ err }, "[GET /employees]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/employees
router.post("/employees", requireAdmin, async (req, res) => {
  const parsed = EmployeeInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error", details: parsed.error.format() }); return; }
  try {
    const [emp] = await db.insert(employeesTable).values({
      ...parsed.data,
      monthlySalary: String(parsed.data.monthlySalary),
      bonus: String(parsed.data.bonus),
      commission: String(parsed.data.commission),
    }).returning();
    res.status(201).json(fmt(emp));
  } catch (err) {
    req.log.error({ err }, "[POST /employees]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/employees/:id
router.patch("/employees/:id", requireAdmin, async (req, res) => {
  const parsed = EmployeeUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error" }); return; }
  try {
    const updates: Record<string, any> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.monthlySalary !== undefined) updates.monthlySalary = String(parsed.data.monthlySalary);
    if (parsed.data.bonus !== undefined) updates.bonus = String(parsed.data.bonus);
    if (parsed.data.commission !== undefined) updates.commission = String(parsed.data.commission);
    const [emp] = await db.update(employeesTable).set(updates).where(eq(employeesTable.id, param(req.params.id))).returning();
    if (!emp) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmt(emp));
  } catch (err) {
    req.log.error({ err }, "[PATCH /employees/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/employees/:id
router.delete("/employees/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(employeesTable).where(eq(employeesTable.id, param(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /employees/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
