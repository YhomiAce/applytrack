import { createPrismaClient } from "../src/lib/prisma-client";
import { seedDemoData } from "../src/lib/seed-demo";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = createPrismaClient(url);
  try {
    const inserted = await seedDemoData(db);
    console.log(inserted ? "Seeded demo account demo@applytrack.dev" : "Demo account already exists, skipping");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
