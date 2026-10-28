import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads `.env` on its own. Load it when present (local dev);
// in production the platform injects real environment variables instead.
try {
  process.loadEnvFile();
} catch {
  // no .env file: rely on the process environment
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` (run at install time) does not need a database, so an
    // empty value is allowed here. `migrate` commands fail fast without it.
    url: process.env.DATABASE_URL ?? "",
  },
});
