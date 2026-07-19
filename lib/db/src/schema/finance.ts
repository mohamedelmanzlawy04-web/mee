import {
  pgTable,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────────
export const expenseCategoryEnum = pgEnum('expense_category', [
  'META_ADS',
  'TIKTOK_ADS',
  'GOOGLE_ADS',
  'SNAPCHAT_ADS',
  'INFLUENCER_MARKETING',
  'MANUFACTURING',
  'PACKAGING',
  'SHIPPING',
  'EMPLOYEE_SALARIES',
  'FREELANCERS',
  'PHOTOGRAPHY',
  'CONTENT_CREATION',
  'OFFICE',
  'EQUIPMENT',
  'SOFTWARE',
  'RENT',
  'UTILITIES',
  'INTERNET',
  'MISCELLANEOUS',
]);

export const paymentMethodEnum = pgEnum('expense_payment_method', [
  'CASH',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'INSTAPAY',
  'VODAFONE_CASH',
  'OTHER',
]);

export const employeePaymentStatusEnum = pgEnum('employee_payment_status', [
  'PAID',
  'PENDING',
  'PARTIAL',
]);

export const adPlatformEnum = pgEnum('ad_platform', [
  'META',
  'TIKTOK',
  'GOOGLE',
  'SNAPCHAT',
  'OTHER',
]);

// ── Expenses ───────────────────────────────────────────────────
export const expensesTable = pgTable(
  'expenses',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    category: expenseCategoryEnum('category').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    date: timestamp('date').notNull(),
    vendor: text('vendor'),
    paymentMethod: paymentMethodEnum('payment_method'),
    notes: text('notes'),
    receiptUrl: text('receipt_url'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    index('expenses_date_idx').on(t.date),
    index('expenses_category_idx').on(t.category),
    index('expenses_deleted_at_idx').on(t.deletedAt),
  ],
);

// ── Employees ──────────────────────────────────────────────────
export const employeesTable = pgTable(
  'employees',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    position: text('position').notNull(),
    monthlySalary: decimal('monthly_salary', { precision: 12, scale: 2 }).notNull(),
    bonus: decimal('bonus', { precision: 12, scale: 2 }).notNull().default('0'),
    commission: decimal('commission', { precision: 12, scale: 2 }).notNull().default('0'),
    paymentStatus: employeePaymentStatusEnum('payment_status').notNull().default('PENDING'),
    isActive: boolean('is_active').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('employees_is_active_idx').on(t.isActive),
  ],
);

// ── Ad Spends ──────────────────────────────────────────────────
export const adSpendsTable = pgTable(
  'ad_spends',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    platform: adPlatformEnum('platform').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    revenue: decimal('revenue', { precision: 12, scale: 2 }).notNull().default('0'),
    impressions: integer('impressions'),
    clicks: integer('clicks'),
    conversions: integer('conversions'),
    date: timestamp('date').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('ad_spends_platform_idx').on(t.platform),
    index('ad_spends_date_idx').on(t.date),
  ],
);

// ── Product Costs ──────────────────────────────────────────────
export const productCostsTable = pgTable(
  'product_costs',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id').notNull(),
    manufacturingCost: decimal('manufacturing_cost', { precision: 10, scale: 2 }).notNull().default('0'),
    packagingCost: decimal('packaging_cost', { precision: 10, scale: 2 }).notNull().default('0'),
    shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).notNull().default('0'),
    advertisingAllocation: decimal('advertising_allocation', { precision: 10, scale: 2 }).notNull().default('0'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('product_costs_product_id_idx').on(t.productId),
  ],
);

// ── Types ──────────────────────────────────────────────────────
export type Expense = typeof expensesTable.$inferSelect;
export type Employee = typeof employeesTable.$inferSelect;
export type AdSpend = typeof adSpendsTable.$inferSelect;
export type ProductCost = typeof productCostsTable.$inferSelect;
