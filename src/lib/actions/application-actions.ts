"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  NotFoundError,
  createApplication,
  deleteApplication,
  importApplications,
  moveApplication,
  setFollowUp,
  updateApplication,
} from "@/lib/applications";
import { formValues, type FormState } from "@/lib/actions/form-state";
import { applicationInputSchema, optionalDate } from "@/lib/domain/application-schema";
import { stageSchema } from "@/lib/domain/constants";
import { MAX_IMPORT_ROWS, parseApplicationsCsv } from "@/lib/domain/csv";
import { requireUser } from "@/lib/session";

const idSchema = z.string().min(1).max(64);

/** Result of an action called directly (not through a form). */
export type ActionResult = { ok: true } | { ok: false; error: string };

function parseApplicationForm(formData: FormData) {
  return applicationInputSchema.safeParse(Object.fromEntries(formData));
}

/** Creates an application from the "new application" form. */
export async function createApplicationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseApplicationForm(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };
  }
  const id = await createApplication(user.id, parsed.data);
  redirect(`/applications/${id}`);
}

/** Saves the edit form. The application id is bound by the page. */
export async function updateApplicationAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  const parsed = parseApplicationForm(formData);
  if (!parsedId.success) return { error: "Application not found" };
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };
  }
  try {
    await updateApplication(user.id, parsedId.data, parsed.data);
  } catch (error) {
    if (error instanceof NotFoundError) return { error: error.message };
    throw error;
  }
  redirect(`/applications/${parsedId.data}`);
}

/** Deletes an application and returns to the board. */
export async function deleteApplicationAction(id: string): Promise<void> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (parsedId.success) {
    try {
      await deleteApplication(user.id, parsedId.data);
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
    }
  }
  redirect("/");
}

const moveSchema = z.object({
  id: idSchema,
  toStage: stageSchema,
  afterId: idSchema.nullable().optional(),
  beforeId: idSchema.nullable().optional(),
});

/** Persists a drag-and-drop move on the board. */
export async function moveApplicationAction(input: z.input<typeof moveSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid move" };
  const { id, ...target } = parsed.data;
  try {
    await moveApplication(user.id, id, target);
  } catch (error) {
    if (error instanceof NotFoundError) return { ok: false, error: error.message };
    console.error("Move failed", error);
    return { ok: false, error: "Could not save the move" };
  }
  refresh();
  return { ok: true };
}

const followUpSchema = z.object({ id: idSchema, followUpAt: optionalDate });

/** Sets (or clears, with an empty date) the follow-up date. */
export async function setFollowUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = followUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  try {
    await setFollowUp(user.id, parsed.data.id, parsed.data.followUpAt);
  } catch (error) {
    if (error instanceof NotFoundError) return { error: error.message };
    throw error;
  }
  refresh();
  return { success: parsed.data.followUpAt ? "Follow-up saved" : "Follow-up cleared" };
}

/** Marks a due follow-up as done (clears the date). */
export async function completeFollowUpAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Application not found" };
  try {
    await setFollowUp(user.id, parsedId.data, null);
  } catch (error) {
    if (error instanceof NotFoundError) return { ok: false, error: error.message };
    throw error;
  }
  refresh();
  return { ok: true };
}

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

/** Imports applications from an uploaded CSV file. */
export async function importCsvAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file to import" };
  if (file.size > MAX_IMPORT_BYTES) return { error: "The file is larger than 2 MB" };

  const { rows, errors } = parseApplicationsCsv(await file.text());
  if (rows.length === 0) {
    return {
      error:
        errors.length > 0
          ? `Nothing imported. ${errors
              .slice(0, 5)
              .map((e) => `Line ${e.line}: ${e.message}`)
              .join(" · ")}`
          : "The file has no rows",
    };
  }
  const created = await importApplications(user.id, rows.slice(0, MAX_IMPORT_ROWS));
  refresh();
  const skipped = errors.length
    ? ` Skipped ${errors.length} invalid row${errors.length === 1 ? "" : "s"}: ${errors
        .slice(0, 5)
        .map((e) => `line ${e.line} (${e.message})`)
        .join("; ")}${errors.length > 5 ? "…" : ""}`
    : "";
  return { success: `Imported ${created} application${created === 1 ? "" : "s"}.${skipped}` };
}
