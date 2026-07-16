import { type NextRequest } from 'next/server';
import { ContactMessageSchema } from '@/lib/validations/contact';
import { created, serverError, parseBody } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, ContactMessageSchema);
    if ('error' in parsed) return parsed.error;

    const message = await prisma.contactMessage.create({ data: parsed.data });
    return created({ id: message.id, message: 'Your message has been received. We will get back to you shortly.' });
  } catch (error) {
    console.error('[POST /api/contact]', error);
    return serverError();
  }
}
