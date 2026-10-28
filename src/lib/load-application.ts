import "server-only";
import { notFound } from "next/navigation";
import { NotFoundError, getApplication, type ApplicationDetail } from "@/lib/applications";
import { requireUser } from "@/lib/session";

/** Loads the signed-in user's application by id, or renders the 404 page. */
export async function loadApplicationOr404(id: string): Promise<ApplicationDetail> {
  const user = await requireUser();
  if (id.length > 64) notFound();
  try {
    return await getApplication(user.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
