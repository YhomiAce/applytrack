import { hash, verify } from "@node-rs/argon2";

/** argon2id parameters (OWASP baseline: 19 MiB memory, 2 iterations). */
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/** Hashes a password with argon2id. */
export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** Verifies a password against an argon2 hash; never throws on malformed hashes. */
export async function verifyPassword(input: { hash: string; password: string }): Promise<boolean> {
  try {
    return await verify(input.hash, input.password);
  } catch {
    return false;
  }
}
