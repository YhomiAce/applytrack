import { describe, expect, it } from "vitest";
import { insertId, planMove, type BoardCard } from "@/lib/domain/board";
import { diffActivities, stageChangeActivity, type TrackedFields } from "@/lib/domain/activity";

const cards: BoardCard[] = [
  { id: "a", stage: "WISHLIST", position: 0 },
  { id: "b", stage: "WISHLIST", position: 1 },
  { id: "c", stage: "WISHLIST", position: 2 },
  { id: "x", stage: "APPLIED", position: 0 },
  { id: "y", stage: "APPLIED", position: 1 },
];

describe("insertId", () => {
  it("places after the given neighbour", () => {
    expect(insertId(["a", "b", "c"], "a", { afterId: "b" })).toEqual(["b", "a", "c"]);
  });
  it("falls back to beforeId, then to the end", () => {
    expect(insertId(["a", "b"], "z", { afterId: "gone", beforeId: "a" })).toEqual(["z", "a", "b"]);
    expect(insertId(["a", "b"], "z", { beforeId: "gone" })).toEqual(["a", "b", "z"]);
  });
});

describe("planMove", () => {
  it("reorders within a column without a stage change", () => {
    const plan = planMove(cards, "c", { toStage: "WISHLIST", beforeId: "a" });
    expect(plan.stageChange).toBeNull();
    expect(plan.updates).toEqual([
      { id: "c", stage: "WISHLIST", position: 0 },
      { id: "a", stage: "WISHLIST", position: 1 },
      { id: "b", stage: "WISHLIST", position: 2 },
    ]);
  });

  it("moves across columns and re-packs the source column", () => {
    const plan = planMove(cards, "a", { toStage: "APPLIED", afterId: "x" });
    expect(plan.stageChange).toEqual({ from: "WISHLIST", to: "APPLIED" });
    expect(plan.updates).toEqual(
      expect.arrayContaining([
        { id: "a", stage: "APPLIED", position: 1 },
        { id: "y", stage: "APPLIED", position: 2 },
        { id: "b", stage: "WISHLIST", position: 0 },
        { id: "c", stage: "WISHLIST", position: 1 },
      ]),
    );
    expect(plan.updates.find((u) => u.id === "x")).toBeUndefined();
  });

  it("drops into an empty column", () => {
    const plan = planMove(cards, "b", { toStage: "OFFER" });
    expect(plan.updates).toContainEqual({ id: "b", stage: "OFFER", position: 0 });
    expect(plan.stageChange).toEqual({ from: "WISHLIST", to: "OFFER" });
  });

  it("is a no-op when dropped where it already is", () => {
    const plan = planMove(cards, "b", { toStage: "WISHLIST", afterId: "a" });
    expect(plan.updates).toEqual([]);
    expect(plan.stageChange).toBeNull();
  });

  it("rejects unknown cards", () => {
    expect(() => planMove(cards, "nope", { toStage: "OFFER" })).toThrow();
  });
});

describe("activity logging", () => {
  const base: TrackedFields = {
    stage: "APPLIED",
    followUpAt: null,
    company: "Acme",
    role: "Engineer",
    salaryMin: 100000,
    salaryMax: 120000,
    location: "Berlin",
    notes: "",
  };

  it("describes stage changes with labels", () => {
    expect(stageChangeActivity("APPLIED", "INTERVIEW")).toEqual({
      type: "STAGE_CHANGED",
      fromStage: "APPLIED",
      toStage: "INTERVIEW",
      message: "Moved from Applied to Interview",
    });
  });

  it("logs nothing when nothing tracked changed", () => {
    expect(diffActivities(base, { ...base })).toEqual([]);
  });

  it("logs stage, follow-up and field edits separately", () => {
    const drafts = diffActivities(base, {
      ...base,
      stage: "SCREENING",
      followUpAt: new Date("2026-11-03T00:00:00Z"),
      salaryMax: 130000,
      notes: "Recruiter call went well",
    });
    expect(drafts.map((d) => d.type)).toEqual(["STAGE_CHANGED", "FOLLOW_UP_SET", "UPDATED"]);
    expect(drafts[1].message).toBe("Follow-up set for 2026-11-03");
    expect(drafts[2].message).toBe("Updated salary, notes");
  });

  it("logs clearing a follow-up", () => {
    const withFollowUp = { ...base, followUpAt: new Date("2026-11-03T00:00:00Z") };
    expect(diffActivities(withFollowUp, base)).toEqual([
      { type: "FOLLOW_UP_CLEARED", message: "Follow-up cleared" },
    ]);
  });
});
