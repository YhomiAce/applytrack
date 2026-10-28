"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { moveApplicationAction } from "@/lib/actions/application-actions";
import { STAGES, type Stage } from "@/lib/domain/constants";
import { CardBody } from "./application-card";
import { BoardColumn } from "./board-column";
import type { BoardCardData } from "./types";

type Columns = Record<Stage, BoardCardData[]>;

function groupByStage(cards: BoardCardData[]): Columns {
  const columns = Object.fromEntries(STAGES.map((s) => [s, [] as BoardCardData[]])) as Columns;
  for (const card of [...cards].sort((a, b) => a.position - b.position)) columns[card.stage].push(card);
  return columns;
}

function findStage(columns: Columns, id: string): Stage | undefined {
  if (id.startsWith("column:")) return id.slice("column:".length) as Stage;
  return STAGES.find((stage) => columns[stage].some((c) => c.id === id));
}

/**
 * The kanban board. Cards move optimistically; the drop is then persisted
 * with a server action using the card's new neighbours, and rolled back if
 * saving fails.
 */
export function KanbanBoard({ cards }: { cards: BoardCardData[] }) {
  const [serverCards, setServerCards] = useState(cards);
  const [columns, setColumns] = useState(() => groupByStage(cards));
  const [snapshot, setSnapshot] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Re-sync when the server sends fresh data (after a refresh or filter change).
  if (serverCards !== cards) {
    setServerCards(cards);
    setColumns(groupByStage(cards));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeCard = activeId ? STAGES.flatMap((s) => columns[s]).find((c) => c.id === activeId) : undefined;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setSnapshot(columns);
    setError(null);
  }

  // Move the card into another column while hovering, so the list makes room.
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    const from = findStage(columns, activeKey);
    const to = findStage(columns, overKey);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const card = prev[from].find((c) => c.id === activeKey);
      if (!card) return prev;
      const target = prev[to];
      const overIndex = target.findIndex((c) => c.id === overKey);
      const index = overIndex === -1 ? target.length : overIndex;
      return {
        ...prev,
        [from]: prev[from].filter((c) => c.id !== activeKey),
        [to]: [...target.slice(0, index), { ...card, stage: to }, ...target.slice(index)],
      };
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const activeKey = String(active.id);
    const before = snapshot;
    setActiveId(null);
    setSnapshot(null);
    if (!over || !before) {
      if (before) setColumns(before);
      return;
    }

    const stage = findStage(columns, activeKey);
    if (!stage) return;
    let column = columns[stage];
    const oldIndex = column.findIndex((c) => c.id === activeKey);
    const overIndex = column.findIndex((c) => c.id === String(over.id));
    if (overIndex !== -1 && overIndex !== oldIndex) column = arrayMove(column, oldIndex, overIndex);
    const next = { ...columns, [stage]: column };

    const originalStage = findStage(before, activeKey);
    const originalIndex = originalStage ? before[originalStage].findIndex((c) => c.id === activeKey) : -1;
    const newIndex = column.findIndex((c) => c.id === activeKey);
    if (originalStage === stage && originalIndex === newIndex) return;

    setColumns(next);
    const afterId = newIndex > 0 ? column[newIndex - 1].id : null;
    const beforeId = newIndex < column.length - 1 ? column[newIndex + 1].id : null;

    startTransition(async () => {
      const result = await moveApplicationAction({ id: activeKey, toStage: stage, afterId, beforeId });
      if (!result.ok) {
        setColumns(before);
        setError(result.error);
      }
    });
  }

  function handleDragCancel() {
    if (snapshot) setColumns(snapshot);
    setSnapshot(null);
    setActiveId(null);
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <DndContext
        id="applytrack-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
          {STAGES.map((stage) => (
            <BoardColumn key={stage} stage={stage} cards={columns[stage]} />
          ))}
        </div>
        <DragOverlay>{activeCard ? <CardBody card={activeCard} overlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
