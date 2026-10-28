import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

/** The signed-in user, narrowed to what the UI needs. */
export type CurrentUser = { id: string; name: string; email: string };

/** Returns the signed-in user, or null when there is no valid session. */
export async function getOptionalUser(): Promise<CurrentUser | null> {
  const requestHeaders = await headers(); // request-time read first: never touch auth at build
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

/**
 * Returns the signed-in user or redirects to the sign-in page. Every page,
 * server action and route handler that touches user data calls this (or
 * {@link getOptionalUser}) itself; nothing trusts the client.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getOptionalUser();
  if (!user) redirect("/sign-in");
  return user;
}
