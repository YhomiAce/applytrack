import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BoardFiltersForm } from "@/components/board/board-filters";
import { FollowUpsPanel } from "@/components/board/follow-ups-panel";
import { KanbanBoard } from "@/components/board/kanban-board";
import type { BoardCardData } from "@/components/board/types";
import { PageLoading } from "@/components/page-loading";
import { buttonVariants } from "@/components/ui/button";
import { listBoardCards, listDueFollowUps, todayIso } from "@/lib/applications";
import { toIsoDate } from "@/lib/domain/application-schema";
import { boardFiltersSchema, hasActiveFilters } from "@/lib/domain/filters";
import { requireUser } from "@/lib/session";
import { formatSalary } from "@/lib/utils";

export const metadata: Metadata = { title: "Board" };

const DAY_MS = 86_400_000;

async function Board({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const user = await requireUser();
  const filters = boardFiltersSchema.parse(await searchParams);
  const today = new Date(todayIso());
  const [rows, due] = await Promise.all([listBoardCards(user.id, filters), listDueFollowUps(user.id, today)]);

  const cards: BoardCardData[] = rows.map((r) => ({
    id: r.id,
    company: r.company,
    role: r.role,
    stage: r.stage,
    position: r.position,
    location: r.location,
    workMode: r.workMode,
    source: r.source,
    salary: formatSalary(r.salaryMin, r.salaryMax, r.currency),
    appliedAt: r.appliedAt ? toIsoDate(r.appliedAt) : null,
    followUpAt: r.followUpAt ? toIsoDate(r.followUpAt) : null,
    followUpDue: Boolean(r.followUpAt && r.followUpAt <= today),
  }));

  return (
    <div className="flex flex-col gap-5">
      <FollowUpsPanel
        items={due.map((d) => ({
          id: d.id,
          company: d.company,
          role: d.role,
          stage: d.stage,
          followUpAt: toIsoDate(d.followUpAt),
          overdueDays: d.followUpAt ? Math.round((today.getTime() - d.followUpAt.getTime()) / DAY_MS) : 0,
        }))}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-semibold">
          Applications <span className="text-muted-foreground">({cards.length})</span>
        </h1>
        <BoardFiltersForm filters={filters} />
      </div>
      {cards.length === 0 && !hasActiveFilters(filters) ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">No applications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first one, or import a CSV.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/applications/new" className={buttonVariants()}>
              New application
            </Link>
            <Link href="/import-export" className={buttonVariants({ variant: "outline" })}>
              Import CSV
            </Link>
          </div>
        </div>
      ) : (
        <KanbanBoard cards={cards} />
      )}
    </div>
  );
}

export default function BoardPage(props: PageProps<"/">) {
  return (
    <Suspense fallback={<PageLoading label="Loading your board…" />}>
      <Board searchParams={props.searchParams} />
    </Suspense>
  );
}
