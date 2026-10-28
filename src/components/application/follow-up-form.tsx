"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { setFollowUpAction } from "@/lib/actions/application-actions";

/** Inline form to set or clear the follow-up date. */
export function FollowUpForm({ id, followUpAt }: { id: string; followUpAt: string }) {
  const [state, formAction, pending] = useActionState(setFollowUpAction, {});
  const uid = useId(); // unique ids: hidden (preserved) routes stay in the DOM
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <Label htmlFor={`${uid}-followUpAt`}>Follow-up date</Label>
      <div className="flex gap-2">
        <Input id={`${uid}-followUpAt`} name="followUpAt" type="date" defaultValue={followUpAt} className="flex-1" />
        <Button type="submit" variant="secondary" disabled={pending}>
          Save
        </Button>
      </div>
      {followUpAt && (
        <Button type="submit" name="followUpAt" value="" variant="link" size="sm" className="self-start px-0" disabled={pending}>
          Clear follow-up
        </Button>
      )}
      {state.success && <p className="text-xs text-emerald-600 dark:text-emerald-400">{state.success}</p>}
      {(state.error || state.fieldErrors?.followUpAt) && (
        <p className="text-xs text-destructive">{state.error ?? state.fieldErrors?.followUpAt?.[0]}</p>
      )}
    </form>
  );
}
