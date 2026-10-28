import { getAuth } from "@/lib/auth";

/** Better Auth HTTP endpoints (session, sign-out, …) under /api/auth/*. */
async function handler(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

export { handler as GET, handler as POST };
