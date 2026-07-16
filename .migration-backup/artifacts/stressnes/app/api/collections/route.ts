import { type NextRequest } from 'next/server';
import { collectionRepository } from '@/repositories/collection.repository';
import { z } from 'zod';
import { ok, created, serverError, parseBody } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

export async function GET() {
  try {
    const collections = await collectionRepository.findAll();
    return ok(collections);
  } catch (error) {
    console.error('[GET /api/collections]', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const parsed = await parseBody(request, CreateCollectionSchema);
    if ('error' in parsed) return parsed.error;

    const collection = await collectionRepository.create(parsed.data);
    return created(collection);
  } catch (error) {
    console.error('[POST /api/collections]', error);
    return serverError();
  }
}
