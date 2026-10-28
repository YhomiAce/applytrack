/** State returned by form server actions and read with `useActionState`. */
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Echo of submitted values so the form can be re-filled after an error. */
  values?: Record<string, string>;
  success?: string;
};

/** Converts FormData to a plain string record (files are skipped). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}
