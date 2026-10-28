import { STAGE_LABELS, type Stage } from "./constants";

/** Activity kinds, mirroring the Prisma `ActivityType` enum. */
export type ActivityType =
  | "CREATED"
  | "STAGE_CHANGED"
  | "UPDATED"
  | "FOLLOW_UP_SET"
  | "FOLLOW_UP_CLEARED"
  | "IMPORTED";

/** An activity row ready to insert (without ids or timestamps). */
export type ActivityDraft = {
  type: ActivityType;
  fromStage?: Stage | null;
  toStage?: Stage | null;
  message?: string | null;
};

/** Fields of an application that are tracked for change logging. */
export type TrackedFields = {
  stage: Stage;
  followUpAt: Date | null;
  company: string;
  role: string;
  salaryMin: number | null;
  salaryMax: number | null;
  location: string | null;
  notes: string;
};

const LABELLED_FIELDS: { key: keyof TrackedFields; label: string }[] = [
  { key: "company", label: "company" },
  { key: "role", label: "role" },
  { key: "location", label: "location" },
  { key: "salaryMin", label: "salary" },
  { key: "salaryMax", label: "salary" },
  { key: "notes", label: "notes" },
];

function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return a === b;
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

/** Activity for moving an application between stages. */
export function stageChangeActivity(from: Stage, to: Stage): ActivityDraft {
  return {
    type: "STAGE_CHANGED",
    fromStage: from,
    toStage: to,
    message: `Moved from ${STAGE_LABELS[from]} to ${STAGE_LABELS[to]}`,
  };
}

/**
 * Diffs an application before and after an edit and returns the activity rows
 * to log: a stage change, a follow-up change, and one summary row for other
 * edited fields. Returns an empty list when nothing tracked changed.
 */
export function diffActivities(before: TrackedFields, after: TrackedFields): ActivityDraft[] {
  const drafts: ActivityDraft[] = [];

  if (before.stage !== after.stage) {
    drafts.push(stageChangeActivity(before.stage, after.stage));
  }

  if (!sameDay(before.followUpAt, after.followUpAt)) {
    drafts.push(
      after.followUpAt
        ? {
            type: "FOLLOW_UP_SET",
            message: `Follow-up set for ${after.followUpAt.toISOString().slice(0, 10)}`,
          }
        : { type: "FOLLOW_UP_CLEARED", message: "Follow-up cleared" },
    );
  }

  const changed = new Set<string>();
  for (const { key, label } of LABELLED_FIELDS) {
    if (before[key] !== after[key]) changed.add(label);
  }
  if (changed.size > 0) {
    drafts.push({ type: "UPDATED", message: `Updated ${[...changed].join(", ")}` });
  }

  return drafts;
}
