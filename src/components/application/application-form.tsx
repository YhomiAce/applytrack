"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { FormState } from "@/lib/actions/form-state";
import {
  SOURCES,
  SOURCE_LABELS,
  STAGES,
  STAGE_LABELS,
  WORK_MODES,
  WORK_MODE_LABELS,
} from "@/lib/domain/constants";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";

/** Initial values for the form, as strings. */
export type ApplicationFormValues = Partial<Record<string, string>>;

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: ApplicationFormValues;
  submitLabel: string;
  cancelHref: string;
};

function Field({
  id,
  label,
  errors,
  className,
  children,
}: {
  id: string;
  label: string;
  errors?: string[];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {errors?.length ? <p className="text-xs text-destructive">{errors[0]}</p> : null}
    </div>
  );
}

/** Create / edit form for an application, with a markdown notes preview. */
export function ApplicationForm({ action, initial = {}, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = { ...initial, ...state.values };
  const errors = state.fieldErrors ?? {};
  const [notes, setNotes] = useState(values.notes ?? "");
  const [preview, setPreview] = useState(false);
  // Next.js keeps visited pages mounted (hidden) via <Activity>, so ids must be
  // unique per instance, and a submitted form is reset once it is hidden.
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  const submitted = useRef(false);
  useEffect(() => {
    submitted.current = false; // the action returned errors: keep the draft
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={() => {
        submitted.current = true;
      }}
      ref={(form) => () => {
        if (submitted.current) {
          submitted.current = false;
          form?.reset();
          setNotes(initial.notes ?? "");
          setPreview(false);
        }
      }}
      className="flex flex-col gap-6"
      noValidate
    >
      {(state.error || Object.keys(errors).length > 0) && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error ?? "Please fix the highlighted fields."}
        </p>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-muted-foreground">Job</legend>
        <Field id={fid("company")} label="Company *" errors={errors.company}>
          <Input id={fid("company")} name="company" defaultValue={values.company} required aria-invalid={Boolean(errors.company)} />
        </Field>
        <Field id={fid("role")} label="Role *" errors={errors.role}>
          <Input id={fid("role")} name="role" defaultValue={values.role} required aria-invalid={Boolean(errors.role)} />
        </Field>
        <Field id={fid("jobUrl")} label="Job URL" errors={errors.jobUrl} className="sm:col-span-2">
          <Input id={fid("jobUrl")} name="jobUrl" type="url" placeholder="https://" defaultValue={values.jobUrl} aria-invalid={Boolean(errors.jobUrl)} />
        </Field>
        <Field id={fid("location")} label="Location" errors={errors.location}>
          <Input id={fid("location")} name="location" placeholder="Berlin, Remote (EU)…" defaultValue={values.location} />
        </Field>
        <Field id={fid("workMode")} label="Work mode" errors={errors.workMode}>
          <Select id={fid("workMode")} name="workMode" defaultValue={values.workMode ?? "ONSITE"}>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {WORK_MODE_LABELS[m]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-[1fr_1fr_6rem] gap-2 sm:col-span-2">
          <Field id={fid("salaryMin")} label="Salary min" errors={errors.salaryMin}>
            <Input id={fid("salaryMin")} name="salaryMin" inputMode="numeric" placeholder="80000" defaultValue={values.salaryMin} aria-invalid={Boolean(errors.salaryMin)} />
          </Field>
          <Field id={fid("salaryMax")} label="Salary max" errors={errors.salaryMax}>
            <Input id={fid("salaryMax")} name="salaryMax" inputMode="numeric" placeholder="95000" defaultValue={values.salaryMax} aria-invalid={Boolean(errors.salaryMax)} />
          </Field>
          <Field id={fid("currency")} label="Currency" errors={errors.currency}>
            <Input id={fid("currency")} name="currency" maxLength={3} defaultValue={values.currency ?? "USD"} className="uppercase" aria-invalid={Boolean(errors.currency)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-muted-foreground">Progress</legend>
        <Field id={fid("stage")} label="Stage" errors={errors.stage}>
          <Select id={fid("stage")} name="stage" defaultValue={values.stage ?? "WISHLIST"}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={fid("source")} label="Source" errors={errors.source}>
          <Select id={fid("source")} name="source" defaultValue={values.source ?? "LINKEDIN"}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={fid("appliedAt")} label="Applied date" errors={errors.appliedAt}>
          <Input id={fid("appliedAt")} name="appliedAt" type="date" defaultValue={values.appliedAt} aria-invalid={Boolean(errors.appliedAt)} />
        </Field>
        <Field id={fid("followUpAt")} label="Follow-up date" errors={errors.followUpAt}>
          <Input id={fid("followUpAt")} name="followUpAt" type="date" defaultValue={values.followUpAt} aria-invalid={Boolean(errors.followUpAt)} />
        </Field>
        <Field id={fid("contactName")} label="Contact person" errors={errors.contactName}>
          <Input id={fid("contactName")} name="contactName" defaultValue={values.contactName} />
        </Field>
        <Field id={fid("contactEmail")} label="Contact email" errors={errors.contactEmail}>
          <Input id={fid("contactEmail")} name="contactEmail" type="email" defaultValue={values.contactEmail} aria-invalid={Boolean(errors.contactEmail)} />
        </Field>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={fid("notes")}>Notes (markdown)</Label>
          <div className="flex gap-1 text-xs" role="tablist">
            <button type="button" role="tab" aria-selected={!preview} onClick={() => setPreview(false)} className={cn("rounded px-2 py-1", !preview && "bg-muted font-medium")}>
              Write
            </button>
            <button type="button" role="tab" aria-selected={preview} onClick={() => setPreview(true)} className={cn("rounded px-2 py-1", preview && "bg-muted font-medium")}>
              Preview
            </button>
          </div>
        </div>
        <Textarea
          id={fid("notes")}
          name="notes"
          rows={8}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={cn("font-mono", preview && "hidden")}
          placeholder={"## Interview prep\n- Questions to ask…"}
        />
        {preview && (
          <div className="min-h-24 rounded-md border p-3">
            {notes.trim() ? <Markdown>{notes}</Markdown> : <p className="text-sm text-muted-foreground">Nothing to preview.</p>}
          </div>
        )}
        {errors.notes?.length ? <p className="text-xs text-destructive">{errors.notes[0]}</p> : null}
      </div>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
