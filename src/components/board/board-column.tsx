"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { STAGE_LABELS, type Stage } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";
import { STAGE_DOT } from "@/components/stage-style";
import { ApplicationCard } from "./application-card";
import type { BoardCardData } from "./types";

/** One stage column: a droppable area holding a sortable list of cards. */
export function BoardColumn({ stage, cards }: { stage: Stage; cards: BoardCardData[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${stage}`, data: { stage } });

  return (
    <section
      aria-label={`${STAGE_LABELS[stage]} column`}
      data-stage={stage}
      className="flex w-72 shrink-0 snap-start flex-col rounded-xl bg-muted/60 md:w-auto md:min-w-48 md:flex-1"
    >
      <header className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className={cn("size-2.5 rounded-full", STAGE_DOT[stage])} aria-hidden />
          {STAGE_LABELS[stage]}
        </h2>
        <span className="rounded-full bg-background px-2 text-xs font-medium text-muted-foreground">{cards.length}</span>
      </header>
      <SortableContext id={stage} items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn(
            "flex min-h-32 flex-1 flex-col gap-2 rounded-b-xl p-2 transition-colors",
            isOver && "bg-accent/60",
          )}
        >
          {cards.map((card) => (
            <ApplicationCard key={card.id} card={card} />
          ))}
          {cards.length === 0 && (
            <li className="list-none rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              Drop here
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}
