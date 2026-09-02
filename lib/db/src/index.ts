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

export * from "./schema";
