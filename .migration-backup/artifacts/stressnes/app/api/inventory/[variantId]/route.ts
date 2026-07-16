import { type NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AdjustInventorySchema } from '@/lib/validations/inventory';
import { ok, notFound, serverError, parseBody } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { variantId } = await params;
    const inventory = await inventoryService.getByVariantId(variantId);
    if (!inventory) return notFound('Inventory not found');

    const history = await inventoryService.getHistory(variantId);
    return ok({ ...inventory, history });
  } catch (error) {
    console.error('[GET /api/inventory/[variantId]]', error);
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { variantId } = await params;
    const parsed = await parseBody(request, AdjustInventorySchema);
    if ('error' in parsed) return parsed.error;

    const result = await inventoryService.adjust(variantId, parsed.data);
    return ok(result);
  } catch (error: unknown) {
    console.error('[PATCH /api/inventory/[variantId]]', error);
    if (error instanceof Error && error.message === 'Insufficient stock') {
      return ok({ error: 'Insufficient stock' });
    }
    return serverError();
  }
}
