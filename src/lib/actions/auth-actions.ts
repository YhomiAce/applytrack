"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAPIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";
import { formValues, type FormState } from "@/lib/actions/form-state";

const signInSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password").max(128),
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(8, "Use at least 8 characters").max(128, "Use at most 128 characters"),
});

function withoutPassword(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([key]) => key !== "password"));
}

/** Signs in with email and password, then redirects to the board. */
export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = withoutPassword(formValues(formData));
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  try {
    const requestHeaders = await headers();
    await getAuth().api.signInEmail({ body: parsed.data, headers: requestHeaders });
  } catch (error) {
    if (isAPIError(error)) return { error: "Invalid email or password", values };
    console.error("Sign-in failed", error);
    return { error: "Something went wrong. Please try again.", values };
  }
  redirect("/");
}

/** Creates an account, signs the new user in and redirects to the board. */
export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = withoutPassword(formValues(formData));
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  try {
    const requestHeaders = await headers();
    await getAuth().api.signUpEmail({ body: parsed.data, headers: requestHeaders });
  } catch (error) {
    if (isAPIError(error)) {
      const message = error.body?.message ?? "Could not create the account";
      return { error: /exist/i.test(message) ? "An account with this email already exists" : message, values };
    }
    console.error("Sign-up failed", error);
    return { error: "Something went wrong. Please try again.", values };
  }
  redirect("/");
}

/** Ends the current session. */
export async function signOutAction(): Promise<void> {
  try {
    const requestHeaders = await headers();
    await getAuth().api.signOut({ headers: requestHeaders });
  } catch (error) {
    console.error("Sign-out failed", error);
  }
  redirect("/sign-in");
}
