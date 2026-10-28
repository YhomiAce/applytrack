import "server-only";
import { z } from "zod";

const booleanFlag = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((value) => value === "true" || value === "1");

const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required" })
    .min(1, "DATABASE_URL is required")
    .refine((v) => v.startsWith("postgres://") || v.startsWith("postgresql://"), {
      message: "DATABASE_URL must be a postgres:// or postgresql:// URL",
    }),
  AUTH_SECRET: z
    .string({ error: "AUTH_SECRET is required" })
    .min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: z.url().optional().or(z.literal("").transform(() => undefined)),
  AUTH_TRUST_HOST: booleanFlag,
  DEMO_MODE: booleanFlag,
});

/** Validated server-side environment. */
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Parses and caches the runtime environment. Called lazily (never at module
 * load) so that `next build` works without any runtime variables set.
 *
 * @throws Error listing every invalid variable when the environment is invalid.
 */
export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** True when the sign-in page should advertise the demo credentials. */
export function isDemoMode(): boolean {
  const value = process.env.DEMO_MODE;
  return value === "true" || value === "1";
}
