import { type NextRequest } from 'next/server';
import { collectionRepository } from '@/repositories/collection.repository';
import { z } from 'zod';
import { ok, notFound, serverError, parseBody } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

const UpdateCollectionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const collection = await collectionRepository.findById(id);
    if (!collection) return notFound('Collection not found');
    return ok(collection);
  } catch (error) {
    console.error('[GET /api/collections/[id]]', error);
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
    const existing = await collectionRepository.findById(id);
    if (!existing) return notFound('Collection not found');

    const parsed = await parseBody(request, UpdateCollectionSchema);
    if ('error' in parsed) return parsed.error;

    const collection = await collectionRepository.update(id, parsed.data);
    return ok(collection);
  } catch (error) {
    console.error('[PATCH /api/collections/[id]]', error);
    return serverError();
  }
}
