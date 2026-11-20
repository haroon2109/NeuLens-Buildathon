/**
 * Session signing secret.
 *
 * The previous fallback constant was committed to the repository, so anyone who
 * could read the source could mint a valid clinician token. There is now no
 * usable fallback in production: a token signed with a public string is the
 * same as no authentication at all.
 */
const MIN_SECRET_LENGTH = 32;

let warnedAboutWeakSecret = false;

export const JWT_MIN_SECRET_LENGTH = MIN_SECRET_LENGTH;

/** Only ever used outside production. When NODE_ENV=production this throws on
 * missing/short secrets so no bearer token can ever be minted with a public or
 * default value. */
const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Resolves the secret at call time (not import time) so a value loaded later in
 * startup, or by a test, is still honoured.
 */
export function getJwtSecret(): string {
  const configured = (process.env.JWT_SECRET || '').trim();

  if (!configured) {
    if (isProduction()) {
      throw new Error(
        'JWT_SECRET is not configured. Refusing to issue or accept session tokens in production.'
      );
    }
    return ''; // development only; never reach this in production
  }

  if (configured.length < MIN_SECRET_LENGTH) {
    if (isProduction()) {
      throw new Error(
        `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production; the configured value is too short to resist guessing.`
      );
    }
    if (!warnedAboutWeakSecret) {
      warnedAboutWeakSecret = true;
      console.warn(
        `[Auth Warning]: JWT_SECRET is shorter than ${MIN_SECRET_LENGTH} characters. Use a long random value before deploying.`
      );
    }
  }

  return configured;
}

/**
 * Refuses to mint any session token when the signing secret is missing or too
 * short in production. This is the single choke point for JWT acceptance: if
 * the secret is not set, every `jwt.verify()` in the app fails closed and no
 * attacker can forge a clinician/patient token with a predictable secret.
 */
export function verifyJwtSecret(): void {
  const configured = (process.env.JWT_SECRET || '').trim();
  if (!configured) {
    throw new Error('JWT_SECRET is not configured. Refusing to start with an unconfigured secret in production.');
  }
  if (configured.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production; the configured value is too short to resist guessing.`);
  }
}

/** Non-throwing form for health checks and startup diagnostics. */
export function describeJwtSecretProblem(): string | null {
  const configured = (process.env.JWT_SECRET || '').trim();
  if (!configured) return 'JWT_SECRET is not configured';
  if (configured.length < MIN_SECRET_LENGTH) {
    return `JWT_SECRET is shorter than ${MIN_SECRET_LENGTH} characters`;
  }
  return null;
}
