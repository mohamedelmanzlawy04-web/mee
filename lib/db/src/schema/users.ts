import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

// ── Enums ──────────────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', ['CUSTOMER', 'ADMIN', 'MODERATOR']);

// ── Users ──────────────────────────────────────────────────────
export const usersTable = pgTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    role: userRoleEnum('role').notNull().default('CUSTOMER'),
    emailVerified: timestamp('email_verified'),
    avatar: text('avatar'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    uniqueIndex('users_email_idx').on(t.email),
    index('users_role_idx').on(t.role),
    index('users_deleted_at_idx').on(t.deletedAt),
  ],
);

// ── OAuth Accounts ─────────────────────────────────────────────
export const accountsTable = pgTable(
  'accounts',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (t) => [
    uniqueIndex('accounts_provider_account_idx').on(t.provider, t.providerAccountId),
    index('accounts_user_id_idx').on(t.userId),
  ],
);

// ── Addresses ─────────────────────────────────────────────────
export const addressesTable = pgTable(
  'addresses',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    line1: text('line1').notNull(),
    line2: text('line2'),
    city: text('city').notNull(),
    state: text('state'),
    postalCode: text('postal_code'),
    country: text('country').notNull().default('EG'),
    phone: text('phone'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('addresses_user_id_idx').on(t.userId)],
);

// ── Zod schemas ────────────────────────────────────────────────
export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type Account = typeof accountsTable.$inferSelect;
export type Address = typeof addressesTable.$inferSelect;
