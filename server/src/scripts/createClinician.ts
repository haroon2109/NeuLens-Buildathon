import 'dotenv/config';
import { HospitalDataStore } from '../models/dataStore';
import { prisma } from '../config/db';

/**
 * Provisions a clinician account.
 *
 * Usage:
 *   CLINICIAN_PASSWORD='...' npm run clinician:create -- \
 *     --email dr.rao@hospital.org --name "Dr. Arun Rao" [--admin]
 *
 * Pass the password through the environment rather than the command line so it
 * is not left in shell history.
 */
async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };

  const email = getArg('--email') || process.env.CLINICIAN_EMAIL;
  const name = getArg('--name') || process.env.CLINICIAN_NAME;
  const password = process.env.CLINICIAN_PASSWORD || getArg('--password');
  const role = args.includes('--admin') ? 'ADMIN' : 'CLINICIAN';

  if (!email || !name || !password) {
    console.error(
      'Missing required values.\n' +
        "  CLINICIAN_PASSWORD='<strong-password>' npm run clinician:create -- \\\n" +
        '    --email clinician@hospital.org --name "Dr. Full Name" [--admin]'
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < 12) {
    console.error('Refusing to create a clinician account with a password shorter than 12 characters.');
    process.exitCode = 1;
    return;
  }

  // A clinician account that only exists in process memory is useless and
  // dangerous to report as created: require a working database.
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    console.error(
      'The database is not reachable. Clinician accounts must be persisted, so nothing was created.\n' +
        'Set DATABASE_URL to a running PostgreSQL instance and apply migrations first.'
    );
    process.exitCode = 1;
    return;
  }

  const user = await HospitalDataStore.createClinician({ name, email, password, role });
  console.log(`Created ${user.role} account ${user.email} (${user.id}).`);
}

main()
  .catch((error) => {
    console.error('[clinician:create]', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
