import { type NextRequest } from 'next/server';
import { productService } from '@/services/product.service';
import { ProductListQuerySchema, CreateProductSchema } from '@/lib/validations/product';
import { created, badRequest, serverError, paginated, parseBody } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const result = ProductListQuerySchema.safeParse(params);
    if (!result.success) return badRequest('Invalid query parameters', result.error.format());

    const { data, total } = await productService.list(result.data);
    return paginated(data, total, result.data.page, result.data.pageSize);
  } catch (error) {
    console.error('[GET /api/products]', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const parsed = await parseBody(request, CreateProductSchema);
    if ('error' in parsed) return parsed.error;

    const product = await productService.create(parsed.data);
    return created(product);
  } catch (error) {
    console.error('[POST /api/products]', error);
    return serverError();
  }
}
