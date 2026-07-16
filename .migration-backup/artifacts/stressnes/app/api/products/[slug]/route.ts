import { type NextRequest } from 'next/server';
import { productService } from '@/services/product.service';
import { UpdateProductSchema } from '@/lib/validations/product';
import { ok, notFound, serverError, parseBody } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const product = await productService.getBySlug(slug);
    if (!product) return notFound('Product not found');
    return ok(product);
  } catch (error) {
    console.error('[GET /api/products/[slug]]', error);
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { slug } = await params;
    const existing = await productService.getBySlug(slug);
    if (!existing) return notFound('Product not found');

    const parsed = await parseBody(request, UpdateProductSchema);
    if ('error' in parsed) return parsed.error;

    const product = await productService.update(existing.id, parsed.data);
    return ok(product);
  } catch (error) {
    console.error('[PATCH /api/products/[slug]]', error);
    return serverError();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { slug } = await params;
    const existing = await productService.getBySlug(slug);
    if (!existing) return notFound('Product not found');

    await productService.delete(existing.id);
    return ok({ success: true });
  } catch (error) {
    console.error('[DELETE /api/products/[slug]]', error);
    return serverError();
  }
}
