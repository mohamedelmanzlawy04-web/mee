/**
 * Seed: Admin user
 * Creates (or updates) the admin account using ADMIN_PASSWORD env var.
 * Defaults to "1234" if ADMIN_PASSWORD is not set.
 * Run: pnpm --filter @workspace/scripts run seed:admin
 */
import bcrypt from 'bcryptjs';
import { db } from '../lib/db/src/index.ts';
import { usersTable } from '../lib/db/src/index.ts';
import { eq } from 'drizzle-orm';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@stressnes.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '1234';
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Admin';

async function seedAdmin() {
  console.log('⏳ Seeding admin user…');

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(usersTable)
      .set({ passwordHash, role: 'ADMIN', fullName: ADMIN_NAME })
      .where(eq(usersTable.email, ADMIN_EMAIL));
    console.log(`  ✓ Updated admin: ${ADMIN_EMAIL}`);
  } else {
    await db
      .insert(usersTable)
      .values({ email: ADMIN_EMAIL, passwordHash, fullName: ADMIN_NAME, role: 'ADMIN' });
    console.log(`  ✓ Created admin: ${ADMIN_EMAIL}`);
  }

  console.log('✅ Admin seeded.');
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
