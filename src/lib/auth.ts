import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/password";

function createAuth() {
  const env = getEnv();
  return betterAuth({
    appName: "ApplyTrack",
    secret: env.AUTH_SECRET,
    // With AUTH_URL set, every URL Better Auth builds uses it. Without it (and
    // AUTH_TRUST_HOST=true) the base URL is inferred per request from the
    // X-Forwarded-Host / X-Forwarded-Proto headers set by the reverse proxy.
    baseURL: env.AUTH_URL,
    trustedOrigins: env.AUTH_URL ? [new URL(env.AUTH_URL).origin] : undefined,
    database: prismaAdapter(getDb(), { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      trustedProxyHeaders: env.AUTH_TRUST_HOST,
    },
    // nextCookies must be last: it forwards Set-Cookie from server actions.
    plugins: [nextCookies()],
  });
}

/** The configured Better Auth instance type. */
export type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as unknown as { auth?: Auth };

/**
 * Returns the Better Auth instance, creating it on first use so that building
 * the app never needs runtime secrets or a database.
 */
export function getAuth(): Auth {
  if (!globalForAuth.auth) globalForAuth.auth = createAuth();
  return globalForAuth.auth;
}
