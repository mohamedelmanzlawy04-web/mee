import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { pageViewsTable } from "@workspace/db";
import {
  count,
  countDistinct,
  sql,
  gte,
  lte,
  and,
  desc,
} from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

// ── Types ───────────────────────────────────────────────────────
type DeviceType = "MOBILE" | "DESKTOP" | "TABLET";
type TrafficSource =
  | "DIRECT"
  | "GOOGLE"
  | "INSTAGRAM"
  | "TIKTOK"
  | "FACEBOOK"
  | "YOUTUBE"
  | "TWITTER"
  | "OTHER";

interface LiveVisitor {
  sessionId: string;
  path: string;
  device: DeviceType;
  source: TrafficSource;
  country: string | null;
  city: string | null;
  lastSeen: number;
}

// ── In-memory live visitor map ──────────────────────────────────
const liveVisitors = new Map<string, LiveVisitor>();
const LIVE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Purge stale visitors every minute
setInterval(() => {
  const cutoff = Date.now() - LIVE_TTL_MS;
  for (const [sid, v] of liveVisitors) {
    if (v.lastSeen < cutoff) liveVisitors.delete(sid);
  }
}, 60_000);

// SSE clients (admin connections)
const sseClients = new Set<Response>();

function pushLiveUpdate() {
  const cutoff = Date.now() - LIVE_TTL_MS;
  const visitors = [...liveVisitors.values()].filter(
    (v) => v.lastSeen >= cutoff,
  );
  const payload =
    "data: " + JSON.stringify({ count: visitors.length, visitors }) + "\n\n";
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function detectDevice(ua: string): DeviceType {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "TABLET";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua))
    return "MOBILE";
  return "DESKTOP";
}

function detectSource(referrer: string | undefined | null): TrafficSource {
  if (!referrer) return "DIRECT";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("google.")) return "GOOGLE";
    if (host.includes("instagram.")) return "INSTAGRAM";
    if (host.includes("tiktok.") || host.includes("vm.tiktok")) return "TIKTOK";
    if (host.includes("facebook.") || host === "fb.com" || host.endsWith(".fb.com"))
      return "FACEBOOK";
    if (host.includes("youtube.") || host.includes("youtu.be")) return "YOUTUBE";
    if (
      host.includes("twitter.") ||
      host.includes("t.co") ||
      host.includes("x.com")
    )
      return "TWITTER";
    return "OTHER";
  } catch {
    return "DIRECT";
  }
}

// In-memory geo cache (IP → country/city)
const geoCache = new Map<string, { country: string | null; city: string | null }>();

async function getGeo(
  ip: string,
): Promise<{ country: string | null; city: string | null }> {
  // Skip private / loopback IPs
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return { country: null, city: null };
  }
  if (geoCache.has(ip)) return geoCache.get(ip)!;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city`,
      { signal: ctrl.signal },
    );
    clearTimeout(t);
    const data = (await res.json()) as {
      status: string;
      country?: string;
      city?: string;
    };
    const geo =
      data.status === "success"
        ? { country: data.country ?? null, city: data.city ?? null }
        : { country: null, city: null };
    geoCache.set(ip, geo);
    return geo;
  } catch {
    return { country: null, city: null };
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? "";
}

// ── Period helpers ──────────────────────────────────────────────
function dayBounds(offsetDays: number): { start: Date; end: Date } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
  return {
    start: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
  };
}

// ── POST /api/analytics/track ───────────────────────────────────
// Public — no auth required. Called by the invisible beacon on every page view.
router.post("/analytics/track", async (req, res) => {
  try {
    const { sessionId, path, referrer } = req.body as {
      sessionId?: string;
      path?: string;
      referrer?: string;
    };

    if (!sessionId || !path) {
      res.status(400).json({ error: "sessionId and path are required" });
      return;
    }

    const ua = req.headers["user-agent"] ?? "";
    const device = detectDevice(ua);
    const source = detectSource(referrer);
    const ip = getClientIp(req);

    // Geo lookup (async, non-blocking for response)
    const geoPromise = getGeo(ip);

    // Update live visitor map immediately (without geo yet)
    liveVisitors.set(sessionId, {
      sessionId,
      path,
      device,
      source,
      country: null,
      city: null,
      lastSeen: Date.now(),
    });

    res.status(204).end();

    // Finish geo + persist to DB after response is sent
    const geo = await geoPromise;

    // Update live visitor with geo
    const existing = liveVisitors.get(sessionId);
    if (existing) {
      existing.country = geo.country;
      existing.city = geo.city;
    }

    await db.insert(pageViewsTable).values({
      sessionId,
      path,
      referrer: referrer ?? null,
      device,
      source,
      country: geo.country,
      city: geo.city,
      ip,
      userAgent: ua,
    });

    pushLiveUpdate();
  } catch (err) {
    // Already responded 204, just log
    console.error("[analytics/track]", err);
  }
});

// ── GET /api/analytics/live ─────────────────────────────────────
// Admin-only SSE stream — pushes live visitor state every 10 s and on new views.
router.get("/analytics/live", requireAdmin, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  sseClients.add(res);

  // Send current state immediately
  const cutoff = Date.now() - LIVE_TTL_MS;
  const visitors = [...liveVisitors.values()].filter(
    (v) => v.lastSeen >= cutoff,
  );
  res.write(
    "data: " + JSON.stringify({ count: visitors.length, visitors }) + "\n\n",
  );

  // Heartbeat every 10 s to keep connection alive and refresh count
  const interval = setInterval(() => {
    const cutoff2 = Date.now() - LIVE_TTL_MS;
    const vs = [...liveVisitors.values()].filter((v) => v.lastSeen >= cutoff2);
    try {
      res.write(
        "data: " + JSON.stringify({ count: vs.length, visitors: vs }) + "\n\n",
      );
    } catch {
      clearInterval(interval);
      sseClients.delete(res);
    }
  }, 10_000);

  req.on("close", () => {
    clearInterval(interval);
    sseClients.delete(res);
  });
});

// ── GET /api/analytics/stats ────────────────────────────────────
// Admin-only. Returns visitor counts + breakdowns.
router.get("/analytics/stats", requireAdmin, async (req, res) => {
  try {
    const today = dayBounds(0);
    const yesterday = dayBounds(-1);
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Unique session counts per period
    const [
      todayRow,
      yesterdayRow,
      weekRow,
      monthRow,
      totalRow,
    ] = await Promise.all([
      db
        .select({ count: countDistinct(pageViewsTable.sessionId) })
        .from(pageViewsTable)
        .where(and(gte(pageViewsTable.createdAt, today.start), lte(pageViewsTable.createdAt, today.end))),
      db
        .select({ count: countDistinct(pageViewsTable.sessionId) })
        .from(pageViewsTable)
        .where(and(gte(pageViewsTable.createdAt, yesterday.start), lte(pageViewsTable.createdAt, yesterday.end))),
      db
        .select({ count: countDistinct(pageViewsTable.sessionId) })
        .from(pageViewsTable)
        .where(gte(pageViewsTable.createdAt, weekStart)),
      db
        .select({ count: countDistinct(pageViewsTable.sessionId) })
        .from(pageViewsTable)
        .where(gte(pageViewsTable.createdAt, monthStart)),
      db
        .select({ count: countDistinct(pageViewsTable.sessionId) })
        .from(pageViewsTable),
    ]);

    // Top pages (last 7 days by page views)
    const topPages = await db
      .select({
        path: pageViewsTable.path,
        views: count(),
      })
      .from(pageViewsTable)
      .where(gte(pageViewsTable.createdAt, weekStart))
      .groupBy(pageViewsTable.path)
      .orderBy(desc(count()))
      .limit(10);

    // Traffic sources (last 30 days)
    const sources = await db
      .select({
        source: pageViewsTable.source,
        count: count(),
      })
      .from(pageViewsTable)
      .where(gte(pageViewsTable.createdAt, monthStart))
      .groupBy(pageViewsTable.source)
      .orderBy(desc(count()));

    // Devices (last 30 days)
    const devices = await db
      .select({
        device: pageViewsTable.device,
        count: count(),
      })
      .from(pageViewsTable)
      .where(gte(pageViewsTable.createdAt, monthStart))
      .groupBy(pageViewsTable.device)
      .orderBy(desc(count()));

    // Top countries (last 30 days)
    const countries = await db
      .select({
        country: pageViewsTable.country,
        count: count(),
      })
      .from(pageViewsTable)
      .where(
        and(
          gte(pageViewsTable.createdAt, monthStart),
          sql`${pageViewsTable.country} is not null`,
        ),
      )
      .groupBy(pageViewsTable.country)
      .orderBy(desc(count()))
      .limit(10);

    res.json({
      today: todayRow[0]?.count ?? 0,
      yesterday: yesterdayRow[0]?.count ?? 0,
      week: weekRow[0]?.count ?? 0,
      month: monthRow[0]?.count ?? 0,
      total: totalRow[0]?.count ?? 0,
      topPages,
      sources,
      devices,
      countries,
    });
  } catch (err) {
    req.log.error({ err }, "[GET /analytics/stats]");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
