"use client";

import { useActionState, useId } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { importCsvAction } from "@/lib/actions/application-actions";

/** CSV upload form. */
export function ImportForm() {
  const [state, formAction, pending] = useActionState(importCsvAction, {});
  const uid = useId(); // unique ids: hidden (preserved) routes stay in the DOM
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Label htmlFor={`${uid}-file`}>CSV file (max 2 MB)</Label>
      <Input id={`${uid}-file`} name="file" type="file" accept=".csv,text/csv" required className="h-auto py-1.5" />
      <Button type="submit" disabled={pending} className="self-start">
        <Upload /> {pending ? "Importing…" : "Import"}
      </Button>
      {state.success && (
        <p role="status" className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
          {state.success}
        </p>
      )}
      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
