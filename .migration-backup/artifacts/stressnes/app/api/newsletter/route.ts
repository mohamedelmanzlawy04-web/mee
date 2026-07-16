import { type NextRequest } from 'next/server';
import { SubscribeSchema } from '@/lib/validations/newsletter';
import { ok, conflict, serverError, parseBody } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, SubscribeSchema);
    if ('error' in parsed) return parsed.error;

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      if (existing.isActive) return conflict('Email is already subscribed');
      // Re-subscribe
      await prisma.newsletterSubscriber.update({
        where: { email: parsed.data.email },
        data: { isActive: true, unsubscribedAt: null },
      });
      return ok({ message: 'Successfully re-subscribed' });
    }

    await prisma.newsletterSubscriber.create({ data: parsed.data });
    return ok({ message: 'Successfully subscribed' });
  } catch (error) {
    console.error('[POST /api/newsletter]', error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email) return ok({ error: 'Email required' });

    await prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
    return ok({ message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('[DELETE /api/newsletter]', error);
    return serverError();
  }
}
