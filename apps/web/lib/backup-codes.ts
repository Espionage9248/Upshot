/**
 * One-time backup recovery codes.
 *
 * Security invariants:
 *   - Codes are generated with a CSPRNG (node:crypto).
 *   - Only the scrypt hash is ever persisted; plaintext is returned to the
 *     caller exactly once (for a one-time display) and never stored or logged.
 *   - Verification uses a constant-time comparison (timingSafeEqual) on the
 *     derived hash bytes, never `===` on the secret.
 */

import {
  randomBytes,
  randomInt,
  scrypt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const CODE_COUNT = 10;
const CODE_LENGTH = 10;
// Crockford-style base32 alphabet minus ambiguous chars (I, L, O, U).
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const SALT_BYTES = 16;
const KEY_LENGTH = 32; // scrypt derived-key length in bytes
const SCHEME = "scrypt";

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

function normalize(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Generate 10 unique recovery codes. Plaintext is returned to the caller for a
 * one-time display and must never be persisted.
 */
export function generateBackupCodes(): string[] {
  const codes = new Set<string>();
  while (codes.size < CODE_COUNT) {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += ALPHABET[randomInt(ALPHABET.length)];
    }
    codes.add(code);
  }
  return [...codes];
}

/**
 * Hash a single code with scrypt and a per-code random salt. Returns a
 * self-describing string `scrypt$<saltHex>$<hashHex>` so verification can
 * re-derive the key. The input is normalized to match verification.
 */
export async function hashBackupCode(code: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scryptAsync(normalize(code), salt);
  return `${SCHEME}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

// `input` MUST already be normalized by the caller (see verifyAndConsume).
// The stored string encodes only salt+hash, NOT the scrypt cost params (N/r/p):
// both this path and hashBackupCode rely on Node's scrypt defaults. Keep them
// identical — if the defaults ever diverge between the two paths, every code
// would silently fail to verify (a self-inflicted recovery lockout).
function verifyOne(input: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== SCHEME || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  // Pin the comparison to our fixed key length; reject anything malformed or
  // truncated rather than comparing against a shorter (weaker) stored hash.
  if (expected.length !== KEY_LENGTH) return false;
  const salt = Buffer.from(saltHex, "hex");
  // verifyAndConsume needs a synchronous answer, so derive synchronously here.
  const derived = scryptSync(input, salt, KEY_LENGTH);
  return timingSafeEqual(derived, expected);
}

/**
 * Verify `input` against the list of stored hashes. On a match, returns the
 * remaining hashes with exactly the matched hash removed (one-time use). On no
 * match, returns the list unchanged. Comparison is constant-time per candidate.
 */
export function verifyAndConsume(
  input: string,
  hashedCodes: string[],
): { ok: boolean; remaining: string[] } {
  const normalized = normalize(input);
  for (let i = 0; i < hashedCodes.length; i++) {
    const candidate = hashedCodes[i];
    if (candidate !== undefined && verifyOne(normalized, candidate)) {
      const remaining = hashedCodes.slice(0, i).concat(hashedCodes.slice(i + 1));
      return { ok: true, remaining };
    }
  }
  return { ok: false, remaining: hashedCodes };
}
