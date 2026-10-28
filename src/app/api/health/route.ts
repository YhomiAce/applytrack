import { connection, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const DB_TIMEOUT_MS = 2000;

/** Liveness + database check. 200 when Postgres answers, 503 otherwise. */
export async function GET(): Promise<NextResponse> {
  await connection(); // always evaluated per request, never prerendered
  const started = Date.now();
  try {
    await Promise.race([
      getDb().$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), DB_TIMEOUT_MS)),
    ]);
    return NextResponse.json(
      { status: "ok", database: "up", latencyMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Health check failed:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { status: "error", database: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
