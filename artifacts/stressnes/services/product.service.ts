import { productRepository } from '@/repositories/product.repository';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { generateSKU, slugify } from '@/lib/utils';
import type { CreateProductInput, UpdateProductInput, ProductListQuery } from '@/lib/validations/product';

export const productService = {
  async list(query: ProductListQuery) {
    const { page, pageSize, search, status, categoryId, collectionId, featured, published, minPrice, maxPrice, sortBy, sortOrder } = query;
    return productRepository.findMany({
      page,
      pageSize,
      where: {
        ...(status ? { status } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(collectionId ? { collectionId } : {}),
        ...(featured !== undefined ? { featured } : {}),
        ...(published !== undefined ? { published } : {}),
        ...(minPrice || maxPrice ? { price: { gte: minPrice, lte: maxPrice } } : {}),
        ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { sku: { contains: search, mode: 'insensitive' as const } }] } : {}),
      },
      orderBy: { [sortBy]: sortOrder },
    });
  },

  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) return null;
    return product;
  },

  async create(input: CreateProductInput) {
    const { tagIds, ...data } = input;
    const slug = input.slug ?? slugify(input.title);
    const sku = input.sku ?? generateSKU(input.categoryId ? 'PRD' : 'GEN');

    return productRepository.create({
      ...data,
      slug,
      sku,
      price: data.price,
      ...(data.comparePrice ? { comparePrice: data.comparePrice } : {}),
      ...(data.costPrice ? { costPrice: data.costPrice } : {}),
      ...(tagIds?.length ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
    });
  },

  async update(id: string, input: UpdateProductInput) {
    const { tagIds, ...data } = input;
    return productRepository.update(id, {
      ...data,
      ...(tagIds ? { tags: { set: tagIds.map((id) => ({ id })) } } : {}),
    });
  },

  async delete(id: string) {
    return productRepository.softDelete(id);
  },

  async getLowStockProducts() {
    return inventoryRepository.getLowStock();
  },
};
