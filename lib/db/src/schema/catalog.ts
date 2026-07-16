import {
  pgTable,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

// ── Enums ──────────────────────────────────────────────────────
export const productStatusEnum = pgEnum('product_status', ['DRAFT', 'ACTIVE', 'ARCHIVED']);

// ── Categories ─────────────────────────────────────────────────
export const categoriesTable = pgTable(
  'categories',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    image: text('image'),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('categories_slug_idx').on(t.slug),
    index('categories_is_active_idx').on(t.isActive),
  ],
);

// ── SubCategories ──────────────────────────────────────────────
export const subCategoriesTable = pgTable(
  'sub_categories',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    categoryId: text('category_id')
      .notNull()
      .references(() => categoriesTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    image: text('image'),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('sub_categories_slug_idx').on(t.slug),
    index('sub_categories_category_id_idx').on(t.categoryId),
  ],
);

// ── Collections ────────────────────────────────────────────────
export const collectionsTable = pgTable(
  'collections',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    image: text('image'),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('collections_slug_idx').on(t.slug),
    index('collections_is_active_idx').on(t.isActive),
  ],
);

// ── Products ───────────────────────────────────────────────────
export const productsTable = pgTable(
  'products',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    shortDescription: text('short_description'),
    sku: text('sku').notNull().unique(),
    barcode: text('barcode').unique(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    comparePrice: decimal('compare_price', { precision: 10, scale: 2 }),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
    status: productStatusEnum('status').notNull().default('DRAFT'),
    featured: boolean('featured').notNull().default(false),
    published: boolean('published').notNull().default(false),
    weight: decimal('weight', { precision: 8, scale: 3 }),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    metaKeywords: text('meta_keywords'),
    categoryId: text('category_id').references(() => categoriesTable.id, { onDelete: 'set null' }),
    subCategoryId: text('sub_category_id').references(() => subCategoriesTable.id, { onDelete: 'set null' }),
    collectionId: text('collection_id').references(() => collectionsTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    uniqueIndex('products_slug_idx').on(t.slug),
    uniqueIndex('products_sku_idx').on(t.sku),
    index('products_status_idx').on(t.status),
    index('products_published_idx').on(t.published),
    index('products_featured_idx').on(t.featured),
    index('products_category_id_idx').on(t.categoryId),
    index('products_collection_id_idx').on(t.collectionId),
    index('products_deleted_at_idx').on(t.deletedAt),
  ],
);

// ── Product Tags ───────────────────────────────────────────────
export const productTagsTable = pgTable(
  'product_tags',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (t) => [index('product_tags_product_id_idx').on(t.productId)],
);

// ── Product Variants ───────────────────────────────────────────
export const productVariantsTable = pgTable(
  'product_variants',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull().unique(),
    size: text('size'),
    color: text('color'),
    material: text('material'),
    priceOverride: decimal('price_override', { precision: 10, scale: 2 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('product_variants_sku_idx').on(t.sku),
    index('product_variants_product_id_idx').on(t.productId),
  ],
);

// ── Product Images ─────────────────────────────────────────────
export const productImagesTable = pgTable(
  'product_images',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    cloudinaryPublicId: text('cloudinary_public_id'),
    url: text('url').notNull(),
    altText: text('alt_text'),
    sortOrder: integer('sort_order').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('product_images_product_id_idx').on(t.productId),
    index('product_images_is_primary_idx').on(t.isPrimary),
  ],
);

// ── Inventory ──────────────────────────────────────────────────
export const inventoryEnum = pgEnum('inventory_change_reason', [
  'PURCHASE',
  'RETURN',
  'ADJUSTMENT',
  'RESERVATION',
  'RELEASE',
  'DAMAGE',
  'RESTOCK',
]);

export const inventoryTable = pgTable(
  'inventory',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    variantId: text('variant_id')
      .notNull()
      .unique()
      .references(() => productVariantsTable.id, { onDelete: 'cascade' }),
    stockQty: integer('stock_qty').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('inventory_variant_id_idx').on(t.variantId)],
);

export const inventoryHistoryTable = pgTable(
  'inventory_history',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    variantId: text('variant_id')
      .notNull()
      .references(() => productVariantsTable.id, { onDelete: 'cascade' }),
    change: integer('change').notNull(),
    reason: inventoryEnum('reason').notNull(),
    reference: text('reference'),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('inventory_history_variant_id_idx').on(t.variantId)],
);

// ── Insert schemas ─────────────────────────────────────────────
export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
export type ProductVariant = typeof productVariantsTable.$inferSelect;
export type ProductImage = typeof productImagesTable.$inferSelect;
export type Category = typeof categoriesTable.$inferSelect;
export type Collection = typeof collectionsTable.$inferSelect;
export type Inventory = typeof inventoryTable.$inferSelect;
