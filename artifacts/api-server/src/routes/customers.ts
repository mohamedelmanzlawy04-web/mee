import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, like, isNull, and, desc, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const param = (p: string | string[]): string => (Array.isArray(p) ? p[0] : p);

const router = Router();

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

const CustomerUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

const safeUserSelect = {
  id: usersTable.id,
  email: usersTable.email,
  fullName: usersTable.fullName,
  phone: usersTable.phone,
  role: usersTable.role,
  avatar: usersTable.avatar,
  createdAt: usersTable.createdAt,
};

// GET /api/customers
router.get("/customers", requireAdmin, async (req, res) => {
  const result = ListQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { page, pageSize, search } = result.data;
  const offset = (page - 1) * pageSize;

  try {
    const conditions = [isNull(usersTable.deletedAt), eq(usersTable.role, "CUSTOMER")];
    if (search) conditions.push(like(usersTable.fullName, `%${search}%`));
    const where = and(...conditions);

    const [data, [{ total }]] = await Promise.all([
      db.select(safeUserSelect).from(usersTable).where(where).orderBy(desc(usersTable.createdAt)).limit(pageSize).offset(offset),
      db.select({ total: count() }).from(usersTable).where(where),
    ]);

    res.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    req.log.error({ err }, "[GET /customers]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/customers/:id
router.get("/customers/:id", requireAuth, async (req, res) => {
  // Customers can only view their own profile; admins can view any
  const targetId = param(req.params.id);
  if (req.user!.role !== "ADMIN" && req.user!.id !== targetId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const [user] = await db
      .select(safeUserSelect)
      .from(usersTable)
      .where(and(eq(usersTable.id, targetId), isNull(usersTable.deletedAt)))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    req.log.error({ err }, "[GET /customers/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/customers/:id
router.patch("/customers/:id", requireAuth, async (req, res) => {
  const targetId = param(req.params.id);
  if (req.user!.role !== "ADMIN" && req.user!.id !== targetId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const result = CustomerUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  try {
    const [user] = await db
      .update(usersTable)
      .set({ ...result.data, updatedAt: new Date() })
      .where(and(eq(usersTable.id, targetId), isNull(usersTable.deletedAt)))
      .returning(safeUserSelect);

    if (!user) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    req.log.error({ err }, "[PATCH /customers/:id]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
