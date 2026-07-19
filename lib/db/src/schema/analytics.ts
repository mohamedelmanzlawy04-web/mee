import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────────
export const deviceTypeEnum = pgEnum('device_type', [
  'MOBILE',
  'DESKTOP',
  'TABLET',
]);

export const trafficSourceEnum = pgEnum('traffic_source', [
  'DIRECT',
  'GOOGLE',
  'INSTAGRAM',
  'TIKTOK',
  'FACEBOOK',
  'YOUTUBE',
  'TWITTER',
  'OTHER',
]);

// ── Page Views ─────────────────────────────────────────────────
export const pageViewsTable = pgTable(
  'page_views',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text('session_id').notNull(),
    path: text('path').notNull(),
    referrer: text('referrer'),
    country: text('country'),
    city: text('city'),
    device: deviceTypeEnum('device').notNull().default('DESKTOP'),
    source: trafficSourceEnum('source').notNull().default('DIRECT'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('page_views_session_id_idx').on(t.sessionId),
    index('page_views_created_at_idx').on(t.createdAt),
    index('page_views_path_idx').on(t.path),
    index('page_views_source_idx').on(t.source),
    index('page_views_device_idx').on(t.device),
  ],
);

export type PageView = typeof pageViewsTable.$inferSelect;
