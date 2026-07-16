import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────────
export const contactStatusEnum = pgEnum('contact_status', ['NEW', 'IN_PROGRESS', 'RESOLVED']);

// ── Newsletter Subscribers ─────────────────────────────────────
export const newsletterSubscribersTable = pgTable(
  'newsletter_subscribers',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull().unique(),
    isActive: boolean('is_active').notNull().default(true),
    subscribedAt: timestamp('subscribed_at').notNull().defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at'),
  },
  (t) => [
    uniqueIndex('newsletter_subscribers_email_idx').on(t.email),
    index('newsletter_subscribers_is_active_idx').on(t.isActive),
  ],
);

// ── Contact Messages ───────────────────────────────────────────
export const contactMessagesTable = pgTable(
  'contact_messages',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    status: contactStatusEnum('status').notNull().default('NEW'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('contact_messages_status_idx').on(t.status),
    index('contact_messages_created_at_idx').on(t.createdAt),
  ],
);

// ── Types ──────────────────────────────────────────────────────
export type NewsletterSubscriber = typeof newsletterSubscribersTable.$inferSelect;
export type ContactMessage = typeof contactMessagesTable.$inferSelect;
