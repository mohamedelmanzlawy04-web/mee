import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton
 *
 * In development, attach to the global object to prevent creating a new
 * PrismaClient on every hot-module reload (which would exhaust DB connections).
 * In production, create a single instance for the process lifetime.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
