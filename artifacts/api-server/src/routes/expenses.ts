import { Router } from "express";
import { db } from "@workspace/db";
import { expensesTable } from "@workspace/db";
import { eq, and, gte, lte, isNull, ilike, desc, count, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const router = Router();
const param = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

const ExpenseInputSchema = z.object({
  title: z.string().min(1),
  category: z.enum(["META_ADS","TIKTOK_ADS","GOOGLE_ADS","SNAPCHAT_ADS","INFLUENCER_MARKETING","MANUFACTURING","PACKAGING","SHIPPING","EMPLOYEE_SALARIES","FREELANCERS","PHOTOGRAPHY","CONTENT_CREATION","OFFICE","EQUIPMENT","SOFTWARE","RENT","UTILITIES","INTERNET","MISCELLANEOUS"]),
  amount: z.number().positive(),
  date: z.string().transform((v) => new Date(v)),
  vendor: z.string().optional(),
  paymentMethod: z.enum(["CASH","BANK_TRANSFER","CREDIT_CARD","DEBIT_CARD","INSTAPAY","VODAFONE_CASH","OTHER"]).optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

const ExpenseUpdateSchema = ExpenseInputSchema.partial();

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
});

function fmtExpense(e: typeof expensesTable.$inferSelect) {
  return { ...e, amount: Number(e.amount) };
}

// GET /api/expenses
router.get("/expenses", requireAdmin, async (req, res) => {
  const q = ListQuerySchema.safeParse(req.query);
  if (!q.success) { res.status(400).json({ error: "Invalid query" }); return; }
  const { page, pageSize, category, from, to, search } = q.data;
  const offset = (page - 1) * pageSize;

  try {
    const conditions: ReturnType<typeof isNull>[] = [isNull(expensesTable.deletedAt)];
    if (category) conditions.push(eq(expensesTable.category, category as any));
    if (from) conditions.push(gte(expensesTable.date, new Date(from)));
    if (to) conditions.push(lte(expensesTable.date, new Date(to)));
    if (search) conditions.push(ilike(expensesTable.title, `%${search}%`));

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [data, [{ total }]] = await Promise.all([
      db.select().from(expensesTable).where(where).orderBy(desc(expensesTable.date)).limit(pageSize).offset(offset),
      db.select({ total: count() }).from(expensesTable).where(where),
    ]);

    res.json({ data: data.map(fmtExpense), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    req.log.error({ err }, "[GET /expenses]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/expenses
router.post("/expenses", requireAdmin, async (req, res) => {
  const parsed = ExpenseInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error", details: parsed.error.format() }); return; }
  try {
    const [expense] = await db.insert(expensesTable).values({
      ...parsed.data,
      amount: String(parsed.data.amount),
    }).returning();
    res.status(201).json(fmtExpense(expense));
  } catch (err) {
    req.log.error({ err }, "[POST /expenses]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/expenses/:id
router.patch("/expenses/:id", requireAdmin, async (req, res) => {
  const parsed = ExpenseUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error" }); return; }
  try {
    const updates: Record<string, any> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.amount !== undefined) updates.amount = String(parsed.data.amount);
    const [expense] = await db
      .update(expensesTable)
      .set(updates)
      .where(and(eq(expensesTable.id, param(req.params.id)), isNull(expensesTable.deletedAt)))
      .returning();
    if (!expense) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmtExpense(expense));
  } catch (err) {
    req.log.error({ err }, "[PATCH /expenses/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/expenses/:id (soft delete)
router.delete("/expenses/:id", requireAdmin, async (req, res) => {
  try {
    await db.update(expensesTable).set({ deletedAt: new Date() }).where(eq(expensesTable.id, param(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[DELETE /expenses/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
