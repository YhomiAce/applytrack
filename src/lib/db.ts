import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";
import { createPrismaClient } from "@/lib/prisma-client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Returns the shared Prisma client, creating it on first use. The client is
 * created lazily so importing this module never requires `DATABASE_URL`
 * (for example during `next build`).
 */
export function getDb(): PrismaClient {
  globalForPrisma.prisma ??= createPrismaClient(getEnv().DATABASE_URL);
  return globalForPrisma.prisma;
}
