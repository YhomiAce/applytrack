import { FUNNEL_STAGES, STAGES, type Stage } from "./constants";

/** Activity fields the stats need. */
export type StatsActivity = {
  type: string;
  fromStage: Stage | null;
  toStage: Stage | null;
  createdAt: Date;
};

/** Application fields the stats need. */
export type StatsApplication = {
  stage: Stage;
  appliedAt: Date | null;
  createdAt: Date;
  activities: StatsActivity[];
};

/** A period spent in one stage. `leftAt` is null for the current stage. */
export type StageInterval = { stage: Stage; enteredAt: Date; leftAt: Date | null };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Monday 00:00 UTC of the week containing `date`. */
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

/**
 * Counts applications by the ISO week (Monday start, UTC) of their applied
 * date, for the `weeks` most recent weeks ending with the week of `now`.
 * Weeks with no applications are included with a count of 0.
 */
export function applicationsPerWeek(
  apps: Pick<StatsApplication, "appliedAt">[],
  now: Date,
  weeks = 12,
): { weekStart: string; count: number }[] {
  const current = startOfIsoWeek(now);
  const buckets = new Map<string, number>();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(current.getTime() - i * 7 * DAY_MS);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const app of apps) {
    if (!app.appliedAt) continue;
    const key = startOfIsoWeek(app.appliedAt).toISOString().slice(0, 10);
    const count = buckets.get(key);
    if (count !== undefined) buckets.set(key, count + 1);
  }
  return [...buckets].map(([weekStart, count]) => ({ weekStart, count }));
}

/**
 * Reconstructs the stages an application went through from its activity log.
 * The first stage comes from the CREATED/IMPORTED activity (or the first stage
 * change's `fromStage`), entered at `createdAt`.
 */
export function stageIntervals(app: StatsApplication): StageInterval[] {
  const sorted = [...app.activities].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const changes = sorted.filter((a) => a.type === "STAGE_CHANGED" && a.toStage);
  const origin = sorted.find((a) => (a.type === "CREATED" || a.type === "IMPORTED") && a.toStage);

  const firstStage: Stage = origin?.toStage ?? changes[0]?.fromStage ?? app.stage;
  const intervals: StageInterval[] = [
    { stage: firstStage, enteredAt: origin?.createdAt ?? app.createdAt, leftAt: null },
  ];
  for (const change of changes) {
    const last = intervals[intervals.length - 1];
    if (change.toStage === last.stage) continue;
    last.leftAt = change.createdAt;
    intervals.push({ stage: change.toStage as Stage, enteredAt: change.createdAt, leftAt: null });
  }
  return intervals;
}

/** Highest funnel index (0 = Applied … 3 = Offer) an application reached, or -1. */
function furthestFunnelIndex(app: StatsApplication): number {
  const visited = new Set<Stage>(stageIntervals(app).map((i) => i.stage));
  visited.add(app.stage);
  let furthest = -1;
  FUNNEL_STAGES.forEach((stage, index) => {
    if (visited.has(stage)) furthest = index;
  });
  // A rejection/withdrawal with an applied date still counts as applied.
  if (furthest === -1 && app.appliedAt) furthest = 0;
  return furthest;
}

/** One funnel step. Rates are 0..1, or null when the base is empty. */
export type FunnelStep = {
  stage: Stage;
  count: number;
  /** Share of the previous step that reached this one. */
  stepRate: number | null;
  /** Share of all applied applications that reached this one. */
  overallRate: number | null;
};

/**
 * Funnel conversion through Applied → Screening → Interview → Offer. An
 * application counts for every step up to the furthest one it reached, so
 * skipping a stage (straight to Interview) still counts as passing Screening.
 */
export function funnel(apps: StatsApplication[]): FunnelStep[] {
  const furthest = apps.map(furthestFunnelIndex);
  const counts = FUNNEL_STAGES.map((_, i) => furthest.filter((f) => f >= i).length);
  return FUNNEL_STAGES.map((stage, i) => ({
    stage,
    count: counts[i],
    stepRate: i === 0 ? null : counts[i - 1] ? counts[i] / counts[i - 1] : null,
    overallRate: counts[0] ? counts[i] / counts[0] : null,
  }));
}

/**
 * Share of applied applications that got any response: reached Screening or
 * later, or were rejected after applying. Null when nothing was applied to.
 */
export function responseRate(apps: StatsApplication[]): {
  applied: number;
  responded: number;
  rate: number | null;
} {
  let applied = 0;
  let responded = 0;
  for (const app of apps) {
    const furthest = furthestFunnelIndex(app);
    if (furthest < 0) continue;
    applied++;
    const rejected = stageIntervals(app).some((i) => i.stage === "REJECTED") || app.stage === "REJECTED";
    if (furthest >= 1 || rejected) responded++;
  }
  return { applied, responded, rate: applied ? responded / applied : null };
}

/**
 * Average number of days spent in each stage, over completed stays only (the
 * current stage of an application is still open and is not counted).
 * Terminal stages (Rejected, Withdrawn) never complete and are omitted.
 */
export function averageDaysPerStage(
  apps: StatsApplication[],
): { stage: Stage; averageDays: number | null; samples: number }[] {
  const totals = new Map<Stage, { days: number; n: number }>();
  for (const app of apps) {
    for (const interval of stageIntervals(app)) {
      if (!interval.leftAt) continue;
      const days = (interval.leftAt.getTime() - interval.enteredAt.getTime()) / DAY_MS;
      const t = totals.get(interval.stage) ?? { days: 0, n: 0 };
      t.days += days;
      t.n += 1;
      totals.set(interval.stage, t);
    }
  }
  return STAGES.filter((s) => s !== "REJECTED" && s !== "WITHDRAWN").map((stage) => {
    const t = totals.get(stage);
    return {
      stage,
      averageDays: t ? Math.round((t.days / t.n) * 10) / 10 : null,
      samples: t?.n ?? 0,
    };
  });
}
