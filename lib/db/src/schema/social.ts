import {
  pgTable,
  text,
  timestamp,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { usersTable } from './users';
import { productsTable } from './catalog';

// ── Enums ──────────────────────────────────────────────────────
export const reviewStatusEnum = pgEnum('review_status', ['PENDING', 'APPROVED', 'REJECTED']);

// ── Reviews ────────────────────────────────────────────────────
export const reviewsTable = pgTable(
  'reviews',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    title: text('title'),
    body: text('body'),
    status: reviewStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('reviews_product_id_idx').on(t.productId),
    index('reviews_user_id_idx').on(t.userId),
    index('reviews_status_idx').on(t.status),
  ],
);

export const reviewImagesTable = pgTable(
  'review_images',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    reviewId: text('review_id')
      .notNull()
      .references(() => reviewsTable.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('review_images_review_id_idx').on(t.reviewId)],
);

// ── Wishlist ───────────────────────────────────────────────────
export const wishlistsTable = pgTable(
  'wishlists',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('wishlists_user_id_idx').on(t.userId)],
);

export const wishlistItemsTable = pgTable(
  'wishlist_items',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    wishlistId: text('wishlist_id')
      .notNull()
      .references(() => wishlistsTable.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('wishlist_items_wishlist_product_idx').on(t.wishlistId, t.productId),
    index('wishlist_items_wishlist_id_idx').on(t.wishlistId),
  ],
);

// ── Types ──────────────────────────────────────────────────────
export type Review = typeof reviewsTable.$inferSelect;
export type WishlistItem = typeof wishlistItemsTable.$inferSelect;
