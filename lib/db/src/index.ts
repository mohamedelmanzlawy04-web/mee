import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Keep connections alive well past a single checkout's worth of idle time
  // so requests reuse a warm connection instead of paying a fresh SSL
  // handshake (often 1-3s alone) on every order. This is very likely the
  // biggest single contributor to the 5-10s checkout time.
  max: 10,
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 5_000,
  keepAlive: true,
});
export const db = drizzle(pool, { schema });

// Keep one connection permanently warm. Without this, any gap longer than
// idleTimeoutMillis (60s) between orders causes the pool to close its last
// connection — so the next customer's checkout has to pay a fresh SSL
// handshake to Supabase before the first query even runs. A tiny query
// every 30s costs nothing and means there's never a "first" cold order.
setInterval(() => {
  pool.query("SELECT 1").catch((err) => {
    console.error("[db] keep-alive ping failed:", err);
  });
}, 30_000).unref();

export * from "./schema";
