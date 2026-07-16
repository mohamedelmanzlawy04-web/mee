import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

export const CreateProductSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().min(1).max(100),
  barcode: z.string().max(100).optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  status: z.nativeEnum(ProductStatus).default('DRAFT'),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  weight: z.number().positive().optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
  metaKeywords: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  subCategoryId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateVariantSchema = z.object({
  sku: z.string().min(1).max(100),
  size: z.string().max(50).optional(),
  color: z.string().max(100).optional(),
  material: z.string().max(100).optional(),
  priceOverride: z.number().positive().optional(),
  isActive: z.boolean().default(true),
  stock: z.number().int().min(0).default(0),
});

export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(24),
  status: z.nativeEnum(ProductStatus).optional(),
  categoryId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  featured: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
  search: z.string().max(200).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sortBy: z.enum(['price', 'createdAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
