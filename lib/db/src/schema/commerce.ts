import {
  pgTable,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  pgEnum,
  json,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { usersTable } from './users';
import { productsTable, productVariantsTable } from './catalog';

// ── Enums ──────────────────────────────────────────────────────
export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'PAID',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'REFUNDED',
]);

export const paymentProviderEnum = pgEnum('payment_provider', [
  'PAYMOB',
  'STRIPE',
  'CASH_ON_DELIVERY',
]);

export const couponTypeEnum = pgEnum('coupon_type', ['PERCENTAGE', 'FIXED_AMOUNT']);

export const shippingCarrierEnum = pgEnum('shipping_carrier', [
  'BOSTA',
  'MYLERZ',
  'ARAMEX',
  'MANUAL',
]);

// ── Cart ───────────────────────────────────────────────────────
export const cartsTable = pgTable(
  'carts',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .unique()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').unique(),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('carts_session_id_idx').on(t.sessionId),
    index('carts_expires_at_idx').on(t.expiresAt),
  ],
);

export const cartItemsTable = pgTable(
  'cart_items',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    cartId: text('cart_id')
      .notNull()
      .references(() => cartsTable.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    variantId: text('variant_id').references(() => productVariantsTable.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull().default(1),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    addedAt: timestamp('added_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('cart_items_cart_product_variant_idx').on(t.cartId, t.productId, t.variantId),
    index('cart_items_cart_id_idx').on(t.cartId),
  ],
);

// ── Orders ─────────────────────────────────────────────────────
export const ordersTable = pgTable(
  'orders',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderNumber: text('order_number').notNull().unique(),
    userId: text('user_id')
      .references(() => usersTable.id, { onDelete: 'restrict' }),
    status: orderStatusEnum('status').notNull().default('PENDING'),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).notNull().default('0'),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('EGP'),
    shippingAddress: json('shipping_address').notNull(),
    billingAddress: json('billing_address'),
    couponId: text('coupon_id'),
    couponCode: text('coupon_code'),
    shippingMethod: text('shipping_method'),
    trackingNumber: text('tracking_number'),
    shippingCarrier: shippingCarrierEnum('shipping_carrier'),
    notes: text('notes'),
    cancelledReason: text('cancelled_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    uniqueIndex('orders_order_number_idx').on(t.orderNumber),
    index('orders_user_id_idx').on(t.userId),
    index('orders_status_idx').on(t.status),
    index('orders_created_at_idx').on(t.createdAt),
  ],
);

export const orderItemsTable = pgTable(
  'order_items',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderId: text('order_id')
      .notNull()
      .references(() => ordersTable.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'restrict' }),
    variantId: text('variant_id').references(() => productVariantsTable.id, { onDelete: 'set null' }),
    productTitle: text('product_title').notNull(),
    variantLabel: text('variant_label'),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  },
  (t) => [index('order_items_order_id_idx').on(t.orderId)],
);

export const paymentsTable = pgTable(
  'payments',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderId: text('order_id')
      .notNull()
      .references(() => ordersTable.id, { onDelete: 'cascade' }),
    provider: paymentProviderEnum('provider').notNull(),
    status: paymentStatusEnum('status').notNull().default('PENDING'),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('EGP'),
    providerReference: text('provider_reference'),
    metadata: json('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('payments_order_id_idx').on(t.orderId)],
);

// ── Coupons ────────────────────────────────────────────────────
export const couponsTable = pgTable(
  'coupons',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    code: text('code').notNull().unique(),
    type: couponTypeEnum('type').notNull(),
    value: decimal('value', { precision: 10, scale: 2 }).notNull(),
    minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('coupons_code_idx').on(t.code),
    index('coupons_is_active_idx').on(t.isActive),
  ],
);

export const couponUsagesTable = pgTable(
  'coupon_usages',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    couponId: text('coupon_id')
      .notNull()
      .references(() => couponsTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    orderId: text('order_id')
      .notNull()
      .references(() => ordersTable.id, { onDelete: 'cascade' }),
    usedAt: timestamp('used_at').notNull().defaultNow(),
  },
  (t) => [index('coupon_usages_coupon_id_idx').on(t.couponId)],
);

// ── Shipping Methods ───────────────────────────────────────────
export const shippingMethodsTable = pgTable(
  'shipping_methods',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    carrier: shippingCarrierEnum('carrier').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    estimatedDays: integer('estimated_days').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('shipping_methods_is_active_idx').on(t.isActive)],
);

// ── Governorates & Cities ──────────────────────────────────────
export const governoratesTable = pgTable(
  'governorates',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull().unique(),
    nameAr: text('name_ar'),
    shippingPrice: decimal('shipping_price', { precision: 10, scale: 2 }).notNull().default('0'),
    estimatedDays: integer('estimated_days').notNull().default(3),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('governorates_is_active_idx').on(t.isActive),
  ],
);

export const citiesTable = pgTable(
  'cities',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    governorateId: text('governorate_id')
      .notNull()
      .references(() => governoratesTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('cities_governorate_id_idx').on(t.governorateId),
    uniqueIndex('cities_gov_name_idx').on(t.governorateId, t.name),
  ],
);

// ── Types ──────────────────────────────────────────────────────
export type Cart = typeof cartsTable.$inferSelect;
export type CartItem = typeof cartItemsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type Coupon = typeof couponsTable.$inferSelect;
export type ShippingMethod = typeof shippingMethodsTable.$inferSelect;
export type Governorate = typeof governoratesTable.$inferSelect;
export type City = typeof citiesTable.$inferSelect;
