import { type NextRequest } from 'next/server';
import { categoryRepository } from '@/repositories/category.repository';
import { z } from 'zod';
import { ok, notFound, serverError, parseBody } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const category = await categoryRepository.findById(id);
    if (!category) return notFound('Category not found');
    return ok(category);
  } catch (error) {
    console.error('[GET /api/categories/[id]]', error);
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = await params;
    const existing = await categoryRepository.findById(id);
    if (!existing) return notFound('Category not found');

    const parsed = await parseBody(request, UpdateCategorySchema);
    if ('error' in parsed) return parsed.error;

    const category = await categoryRepository.update(id, parsed.data);
    return ok(category);
  } catch (error) {
    console.error('[PATCH /api/categories/[id]]', error);
    return serverError();
  }
}
