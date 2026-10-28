"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BellRing, MapPin } from "lucide-react";
import { SOURCE_LABELS, WORK_MODE_LABELS } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";
import type { BoardCardData } from "./types";

/** Visual card body, shared by the sortable card and the drag overlay. */
export function CardBody({ card, overlay = false }: { card: BoardCardData; overlay?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 text-sm shadow-xs transition-shadow",
        overlay ? "rotate-2 shadow-lg ring-2 ring-ring" : "hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{card.company}</p>
          <p className="truncate text-muted-foreground">{card.role}</p>
        </div>
        {card.followUpAt && (
          <span
            title={`Follow up ${card.followUpAt}`}
            className={cn("shrink-0", card.followUpDue ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
          >
            <BellRing className="size-4" aria-label={card.followUpDue ? "Follow-up due" : "Follow-up scheduled"} />
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {card.location && (
          <span className="flex min-w-0 items-center gap-0.5">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{card.location}</span>
          </span>
        )}
        <span className="rounded bg-muted px-1.5 py-0.5">{WORK_MODE_LABELS[card.workMode]}</span>
        <span>{SOURCE_LABELS[card.source]}</span>
      </div>
      {(card.salary || card.appliedAt) && (
        <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>{card.salary}</span>
          {card.appliedAt && <span>Applied {card.appliedAt}</span>}
        </div>
      )}
    </div>
  );
}

/** A draggable card on the board; clicking it opens the application. */
export function ApplicationCard({ card }: { card: BoardCardData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { stage: card.stage },
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("touch-manipulation list-none", isDragging && "opacity-40")}
      data-testid="board-card"
      data-card-id={card.id}
      {...attributes}
      {...listeners}
    >
      <Link
        href={`/applications/${card.id}`}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        draggable={false}
        tabIndex={-1}
      >
        <CardBody card={card} />
      </Link>
    </li>
  );
}
