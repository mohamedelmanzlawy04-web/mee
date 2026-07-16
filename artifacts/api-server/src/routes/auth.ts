import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const result = RegisterSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error", details: result.error.format() });
    return;
  }

  const { email, password, fullName, phone } = result.data;

  try {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(usersTable)
      .values({ email, passwordHash, fullName, phone })
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        fullName: usersTable.fullName,
        phone: usersTable.phone,
        role: usersTable.role,
        avatar: usersTable.avatar,
        createdAt: usersTable.createdAt,
      });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ user, token });
  } catch (err) {
    req.log.error({ err }, "[POST /auth/register]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const { email, password } = result.data;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 });
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    req.log.error({ err }, "[POST /auth/login]");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/auth/logout
router.delete("/auth/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        fullName: usersTable.fullName,
        phone: usersTable.phone,
        role: usersTable.role,
        avatar: usersTable.avatar,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    req.log.error({ err }, "[GET /auth/me]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
