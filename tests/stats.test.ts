import { describe, expect, it } from "vitest";
import {
  applicationsPerWeek,
  averageDaysPerStage,
  funnel,
  responseRate,
  stageIntervals,
  startOfIsoWeek,
  type StatsApplication,
} from "@/lib/domain/stats";
import type { Stage } from "@/lib/domain/constants";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

function app(stage: Stage, appliedAt: string | null, path: [Stage, string][]): StatsApplication {
  const [first, ...rest] = path;
  return {
    stage,
    appliedAt: appliedAt ? d(appliedAt) : null,
    createdAt: d(first[1]),
    activities: [
      { type: "CREATED", fromStage: null, toStage: first[0], createdAt: d(first[1]) },
      ...rest.map(([to, at], i) => ({
        type: "STAGE_CHANGED",
        fromStage: (i === 0 ? first[0] : rest[i - 1][0]) as Stage,
        toStage: to,
        createdAt: d(at),
      })),
    ],
  };
}

const apps: StatsApplication[] = [
  // Applied, never heard back
  app("APPLIED", "2026-10-05", [["APPLIED", "2026-10-05"]]),
  // Applied -> Rejected (counts as a response)
  app("REJECTED", "2026-10-06", [["APPLIED", "2026-10-06"], ["REJECTED", "2026-10-16"]]),
  // Wishlist -> Applied -> Screening -> Interview
  app("INTERVIEW", "2026-10-02", [
    ["WISHLIST", "2026-09-30"],
    ["APPLIED", "2026-10-02"],
    ["SCREENING", "2026-10-08"],
    ["INTERVIEW", "2026-10-12"],
  ]),
  // Applied -> straight to Interview -> Offer (skips Screening)
  app("OFFER", "2026-10-13", [
    ["APPLIED", "2026-10-13"],
    ["INTERVIEW", "2026-10-17"],
    ["OFFER", "2026-10-27"],
  ]),
  // Wishlist only: not part of the funnel
  app("WISHLIST", null, [["WISHLIST", "2026-10-20"]]),
];

describe("startOfIsoWeek", () => {
  it("returns the Monday of the week", () => {
    expect(startOfIsoWeek(d("2026-10-28")).toISOString().slice(0, 10)).toBe("2026-10-26");
    expect(startOfIsoWeek(d("2026-11-01")).toISOString().slice(0, 10)).toBe("2026-10-26");
    expect(startOfIsoWeek(d("2026-10-26")).toISOString().slice(0, 10)).toBe("2026-10-26");
  });
});

describe("applicationsPerWeek", () => {
  it("buckets by applied date and fills empty weeks", () => {
    const weeks = applicationsPerWeek(apps, d("2026-10-28"), 5);
    expect(weeks).toEqual([
      { weekStart: "2026-09-28", count: 1 },
      { weekStart: "2026-10-05", count: 2 },
      { weekStart: "2026-10-12", count: 1 },
      { weekStart: "2026-10-19", count: 0 },
      { weekStart: "2026-10-26", count: 0 },
    ]);
  });
});

describe("stageIntervals", () => {
  it("rebuilds the path from the activity log", () => {
    const intervals = stageIntervals(apps[2]);
    expect(intervals.map((i) => i.stage)).toEqual(["WISHLIST", "APPLIED", "SCREENING", "INTERVIEW"]);
    expect(intervals[3].leftAt).toBeNull();
  });
});

describe("funnel", () => {
  it("counts skipped stages as passed", () => {
    const steps = funnel(apps);
    expect(steps.map((s) => [s.stage, s.count])).toEqual([
      ["APPLIED", 4],
      ["SCREENING", 2],
      ["INTERVIEW", 2],
      ["OFFER", 1],
    ]);
    expect(steps[0].stepRate).toBeNull();
    expect(steps[1].stepRate).toBe(0.5);
    expect(steps[2].stepRate).toBe(1);
    expect(steps[3].overallRate).toBe(0.25);
  });

  it("handles an empty list", () => {
    expect(funnel([]).every((s) => s.count === 0 && s.overallRate === null)).toBe(true);
  });
});

describe("responseRate", () => {
  it("counts progress and rejections as responses", () => {
    expect(responseRate(apps)).toEqual({ applied: 4, responded: 3, rate: 0.75 });
  });
});

describe("averageDaysPerStage", () => {
  it("averages completed stays only", () => {
    const byStage = Object.fromEntries(averageDaysPerStage(apps).map((s) => [s.stage, s]));
    // Applied stays: 10 (rejected), 6, 4 -> 6.7 ; first app still in Applied (open)
    expect(byStage.APPLIED).toEqual({ stage: "APPLIED", averageDays: 6.7, samples: 3 });
    expect(byStage.WISHLIST.averageDays).toBe(2);
    expect(byStage.SCREENING.averageDays).toBe(4);
    expect(byStage.INTERVIEW).toMatchObject({ averageDays: 10, samples: 1 });
    expect(byStage.OFFER).toMatchObject({ averageDays: null, samples: 0 });
    expect(byStage.REJECTED).toBeUndefined();
  });
});
