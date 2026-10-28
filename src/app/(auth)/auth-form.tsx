"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { FormState } from "@/lib/actions/form-state";

type Props = {
  mode: "sign-in" | "sign-up";
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-destructive">{messages[0]}</p>;
}

/** Email + password form shared by sign-in and sign-up. */
export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignUp = mode === "sign-up";
  const uid = useId(); // unique ids: hidden (preserved) routes stay in the DOM

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {isSignUp && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-name`}>Name</Label>
          <Input id={`${uid}-name`} name="name" autoComplete="name" defaultValue={state.values?.name} aria-invalid={Boolean(state.fieldErrors?.name)} required />
          <FieldError messages={state.fieldErrors?.name} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-email`}>Email</Label>
        <Input
          id={`${uid}-email`}
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          required
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-password`}>Password</Label>
        <Input
          id={`${uid}-password`}
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={isSignUp ? 8 : undefined}
          aria-invalid={Boolean(state.fieldErrors?.password)}
          required
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? (
          <>
            Already have an account? <Link className="text-primary hover:underline" href="/sign-in">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link className="text-primary hover:underline" href="/sign-up">Create an account</Link>
          </>
        )}
      </p>
    </form>
  );
}
