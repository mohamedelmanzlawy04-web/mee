import { NextResponse } from 'next/server';

/** Standard paginated list shape */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): NextResponse {
  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  } satisfies PaginatedResult<T>);
}

/** Parse and validate a request body, returning null on failure */
export async function parseBody<T>(
  request: Request,
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { format: () => unknown } } },
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return { error: badRequest('Validation error', result.error.format()) };
    }
    return { data: result.data };
  } catch {
    return { error: badRequest('Invalid JSON body') };
  }
}
