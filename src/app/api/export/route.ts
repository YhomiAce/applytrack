import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { listForExport } from "@/lib/applications";
import { getAuth } from "@/lib/auth";
import { serializeApplications } from "@/lib/domain/csv";

/** Downloads the signed-in user's applications as CSV. */
export async function GET(): Promise<Response> {
  const requestHeaders = await headers(); // request-time read first: never touch auth at build
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apps = await listForExport(session.user.id);
  const csv = serializeApplications(apps);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applytrack-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
