import { type NextRequest } from 'next/server';
import { categoryRepository } from '@/repositories/category.repository';
import { z } from 'zod';
import { ok, created, serverError, parseBody } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  try {
    const categories = await categoryRepository.findAll();
    return ok(categories);
  } catch (error) {
    console.error('[GET /api/categories]', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const parsed = await parseBody(request, CreateCategorySchema);
    if ('error' in parsed) return parsed.error;

    const category = await categoryRepository.create(parsed.data);
    return created(category);
  } catch (error) {
    console.error('[POST /api/categories]', error);
    return serverError();
  }
}
