import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Production migration step.
 *
 * Runs `prisma migrate deploy` as its own deploy step (not baked into server
 * startup) so a bad migration fails the deploy rather than starting the service
 * in a degraded, in-memory-only mode.
 *
 * Used by CI to verify the deploy-time migration path and by the deploy command
 * in render.yaml.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured. Refusing to run migrations.');
    process.exitCode = 1;
    return;
  }
  if (process.env.NODE_ENV !== 'test') {
    console.log('[migrate:deploy] Will apply pending migrations via prisma migrate deploy.');
  }

  const client = new PrismaClient({ log: ['error'] });

  try {
    // Quick connectivity probe so the deploy fails with a clear message if the
    // database is down instead of timing out deep in the migration runner.
    await client.$queryRaw`SELECT 1`;
    console.log('[migrate:deploy] Database reachable. Applying pending migrations.');

    // prisma migrate deploy exits non-zero on a failed migration, which is what
    // we want for a deploy command: the deploy rolls back instead of silently
    // starting a server that cannot persist records.
    const { execSync } = await import('child_process');
    execSync('npx prisma migrate deploy --schema=server/prisma/schema.prisma', {
      stdio: 'inherit',
    });

    console.log('[migrate:deploy] Migrations applied.');
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error('[migrate:deploy] Migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
