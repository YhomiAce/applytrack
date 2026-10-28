import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { diffActivities, stageChangeActivity, type ActivityDraft } from "@/lib/domain/activity";
import type { ApplicationInput } from "@/lib/domain/application-schema";
import { planMove, type DropTarget } from "@/lib/domain/board";
import type { BoardFilters } from "@/lib/domain/filters";

/**
 * Data access for job applications. Every function takes the signed-in user's
 * id and scopes every query by it, so one user can never read or change
 * another user's applications.
 */

/** Thrown when an application doesn't exist or belongs to someone else. */
export class NotFoundError extends Error {
  constructor() {
    super("Application not found");
  }
}

const cardSelect = {
  id: true,
  company: true,
  role: true,
  stage: true,
  position: true,
  location: true,
  workMode: true,
  source: true,
  salaryMin: true,
  salaryMax: true,
  currency: true,
  appliedAt: true,
  followUpAt: true,
} satisfies Prisma.ApplicationSelect;

/** A board card as loaded from the database. */
export type BoardCardRow = Prisma.ApplicationGetPayload<{ select: typeof cardSelect }>;

function filterWhere(userId: string, filters: BoardFilters): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = { userId };
  if (filters.stage) where.stage = filters.stage;
  if (filters.workMode) where.workMode = filters.workMode;
  if (filters.source) where.source = filters.source;
  if (filters.q) {
    const contains = { contains: filters.q, mode: "insensitive" as const };
    where.OR = [
      { company: contains },
      { role: contains },
      { location: contains },
      { contactName: contains },
      { notes: contains },
    ];
  }
  return where;
}

/** Lists the user's board cards matching `filters`, ordered by stage position. */
export function listBoardCards(userId: string, filters: BoardFilters): Promise<BoardCardRow[]> {
  return getDb().application.findMany({
    where: filterWhere(userId, filters),
    select: cardSelect,
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Follow-ups due on or before `today` (UTC date), oldest first. Closed
 * applications (Rejected, Withdrawn) are excluded.
 */
export function listDueFollowUps(userId: string, today: Date) {
  return getDb().application.findMany({
    where: {
      userId,
      followUpAt: { lte: today },
      stage: { notIn: ["REJECTED", "WITHDRAWN"] },
    },
    select: { id: true, company: true, role: true, stage: true, followUpAt: true },
    orderBy: { followUpAt: "asc" },
    take: 20,
  });
}

/** Loads one application with its activity timeline (newest first). */
export async function getApplication(userId: string, id: string) {
  const app = await getDb().application.findFirst({
    where: { id, userId },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!app) throw new NotFoundError();
  return app;
}

/** Full application with activities, as returned by {@link getApplication}. */
export type ApplicationDetail = Awaited<ReturnType<typeof getApplication>>;

async function nextPosition(tx: Prisma.TransactionClient, userId: string, stage: ApplicationInput["stage"]) {
  const last = await tx.application.findFirst({
    where: { userId, stage },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return last ? last.position + 1 : 0;
}

/** Creates an application at the bottom of its stage column and logs it. */
export async function createApplication(userId: string, input: ApplicationInput): Promise<string> {
  return getDb().$transaction(async (tx) => {
    const position = await nextPosition(tx, userId, input.stage);
    const app = await tx.application.create({
      data: {
        ...input,
        appliedAt: input.appliedAt ?? (input.stage === "WISHLIST" ? null : new Date(todayIso())),
        userId,
        position,
        activities: {
          create: [
            { type: "CREATED", toStage: input.stage, message: "Application added" },
            ...(input.followUpAt
              ? [{ type: "FOLLOW_UP_SET" as const, message: `Follow-up set for ${isoDate(input.followUpAt)}` }]
              : []),
          ],
        },
      },
      select: { id: true },
    });
    return app.id;
  });
}

/**
 * Updates an application and logs what changed. A stage change made through
 * the form moves the card to the bottom of its new column.
 */
export async function updateApplication(userId: string, id: string, input: ApplicationInput): Promise<void> {
  await getDb().$transaction(async (tx) => {
    const before = await tx.application.findFirst({ where: { id, userId } });
    if (!before) throw new NotFoundError();

    const drafts = diffActivities(before, input);
    const stageChanged = before.stage !== input.stage;
    const position = stageChanged ? await nextPosition(tx, userId, input.stage) : before.position;
    const appliedAt =
      input.appliedAt ?? (before.stage === "WISHLIST" && input.stage !== "WISHLIST" ? new Date(todayIso()) : null);

    await tx.application.update({
      where: { id },
      data: {
        ...input,
        appliedAt,
        position,
        activities: { create: drafts.map(toActivityCreate) },
      },
    });
  });
}

/**
 * Applies a drag-and-drop move: re-numbers the affected columns, logs a stage
 * change, and stamps the applied date when a card first leaves the Wishlist.
 */
export async function moveApplication(userId: string, id: string, target: DropTarget): Promise<void> {
  await getDb().$transaction(async (tx) => {
    // Serialise concurrent moves by the same user (e.g. two tabs).
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    const cards = await tx.application.findMany({
      where: { userId },
      select: { id: true, stage: true, position: true, appliedAt: true },
    });
    const moved = cards.find((c) => c.id === id);
    if (!moved) throw new NotFoundError();

    const plan = planMove(cards, id, target);
    for (const update of plan.updates) {
      await tx.application.update({
        where: { id: update.id },
        data: { stage: update.stage, position: update.position },
      });
    }
    if (plan.stageChange) {
      await tx.activity.create({
        data: { applicationId: id, ...stageChangeActivity(plan.stageChange.from, plan.stageChange.to) },
      });
      if (!moved.appliedAt && plan.stageChange.from === "WISHLIST") {
        await tx.application.update({ where: { id }, data: { appliedAt: new Date(todayIso()) } });
      }
    }
  });
}

/** Sets or clears just the follow-up date. */
export async function setFollowUp(userId: string, id: string, followUpAt: Date | null): Promise<void> {
  await getDb().$transaction(async (tx) => {
    const before = await tx.application.findFirst({ where: { id, userId } });
    if (!before) throw new NotFoundError();
    const drafts = diffActivities(before, { ...before, followUpAt });
    await tx.application.update({
      where: { id },
      data: { followUpAt, activities: { create: drafts.map(toActivityCreate) } },
    });
  });
}

/** Deletes an application (its activities cascade). */
export async function deleteApplication(userId: string, id: string): Promise<void> {
  const { count } = await getDb().application.deleteMany({ where: { id, userId } });
  if (count === 0) throw new NotFoundError();
}

/** Inserts imported rows at the bottom of their columns. Returns how many were created. */
export async function importApplications(userId: string, rows: ApplicationInput[]): Promise<number> {
  if (rows.length === 0) return 0;
  return getDb().$transaction(async (tx) => {
    const positions = new Map<string, number>();
    for (const row of rows) {
      const position = positions.get(row.stage) ?? (await nextPosition(tx, userId, row.stage));
      positions.set(row.stage, position + 1);
      await tx.application.create({
        data: {
          ...row,
          userId,
          position,
          activities: { create: [{ type: "IMPORTED", toStage: row.stage, message: "Imported from CSV" }] },
        },
      });
    }
    return rows.length;
  });
}

/** All of the user's applications for CSV export, in board order. */
export function listForExport(userId: string) {
  return getDb().application.findMany({
    where: { userId },
    orderBy: [{ stage: "asc" }, { position: "asc" }],
  });
}

/** Applications with their stage history, for the stats page. */
export function listForStats(userId: string) {
  return getDb().application.findMany({
    where: { userId },
    select: {
      stage: true,
      appliedAt: true,
      createdAt: true,
      activities: { select: { type: true, fromStage: true, toStage: true, createdAt: true } },
    },
  });
}

function toActivityCreate(draft: ActivityDraft): Prisma.ActivityCreateWithoutApplicationInput {
  return {
    type: draft.type,
    fromStage: draft.fromStage ?? null,
    toStage: draft.toStage ?? null,
    message: draft.message ?? null,
  };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's date as `YYYY-MM-DDT00:00:00Z` (UTC). */
export function todayIso(): string {
  return `${new Date().toISOString().slice(0, 10)}T00:00:00Z`;
}
