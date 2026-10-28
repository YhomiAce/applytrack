/**
 * Runs once when a Next.js server starts. Seeds the demo account on first
 * start so a fresh deployment isn't empty. Never blocks startup on failure.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!process.env.DATABASE_URL) {
    console.warn("[applytrack] DATABASE_URL is not set; skipping demo seed");
    return;
  }
  if (process.env.SEED_DEMO_DATA === "false") return;

  const { createPrismaClient } = await import("@/lib/prisma-client");
  const { seedDemoData } = await import("@/lib/seed-demo");
  const db = createPrismaClient(process.env.DATABASE_URL);
  try {
    if (await seedDemoData(db)) console.log("[applytrack] Seeded demo account demo@applytrack.dev");
  } catch (error) {
    console.error("[applytrack] Demo seed failed:", error instanceof Error ? error.message : error);
  } finally {
    await db.$disconnect();
  }
}
