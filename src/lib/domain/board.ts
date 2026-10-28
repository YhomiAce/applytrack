import type { Stage } from "./constants";

/** Minimal card shape needed to compute board moves. */
export type BoardCard = { id: string; stage: Stage; position: number };

/** Where a card was dropped, relative to its new neighbours in the target column. */
export type DropTarget = {
  toStage: Stage;
  /** Card that should end up directly above the moved card, if any. */
  afterId?: string | null;
  /** Card that should end up directly below the moved card, if any. */
  beforeId?: string | null;
};

/** One row to persist after a move. */
export type PositionUpdate = { id: string; stage: Stage; position: number };

/** Result of planning a move: what to write, and what to log. */
export type MovePlan = {
  updates: PositionUpdate[];
  stageChange: { from: Stage; to: Stage } | null;
};

function sortColumn(cards: BoardCard[], stage: Stage): BoardCard[] {
  return cards
    .filter((c) => c.stage === stage)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

/**
 * Inserts `movedId` into an ordered list of ids. Neighbour ids are hints from a
 * possibly filtered view: `afterId` wins, then `beforeId`; if neither is found
 * the card goes to the end. Unknown ids are ignored, so stale clients can't
 * corrupt the order.
 */
export function insertId(
  columnIds: string[],
  movedId: string,
  target: Pick<DropTarget, "afterId" | "beforeId">,
): string[] {
  const ids = columnIds.filter((id) => id !== movedId);
  if (target.afterId) {
    const i = ids.indexOf(target.afterId);
    if (i !== -1) {
      ids.splice(i + 1, 0, movedId);
      return ids;
    }
  }
  if (target.beforeId) {
    const i = ids.indexOf(target.beforeId);
    if (i !== -1) {
      ids.splice(i, 0, movedId);
      return ids;
    }
  }
  ids.push(movedId);
  return ids;
}

/**
 * Plans a drag-and-drop move on the board. Re-numbers the target column (and
 * the source column when the card changes stage) with dense 0..n positions and
 * returns only the rows whose stage or position actually changed.
 *
 * @throws Error when `movedId` is not one of `cards`.
 */
export function planMove(cards: BoardCard[], movedId: string, target: DropTarget): MovePlan {
  const moved = cards.find((c) => c.id === movedId);
  if (!moved) throw new Error(`Card ${movedId} not found`);

  const fromStage = moved.stage;
  const toStage = target.toStage;
  const byId = new Map(cards.map((c) => [c.id, c]));
  const updates: PositionUpdate[] = [];

  const push = (ids: string[], stage: Stage) => {
    ids.forEach((id, position) => {
      const card = byId.get(id);
      if (!card) return;
      if (card.position !== position || card.stage !== stage) {
        updates.push({ id, stage, position });
      }
    });
  };

  const targetIds = insertId(
    sortColumn(cards, toStage).map((c) => c.id),
    movedId,
    target,
  );
  push(targetIds, toStage);

  if (fromStage !== toStage) {
    const sourceIds = sortColumn(cards, fromStage)
      .map((c) => c.id)
      .filter((id) => id !== movedId);
    push(sourceIds, fromStage);
  }

  return {
    updates,
    stageChange: fromStage === toStage ? null : { from: fromStage, to: toStage },
  };
}
