import { ArrowRight, BellRing, FilePlus2, Pencil, Upload } from "lucide-react";
import type { ActivityType } from "@/lib/domain/activity";
import type { Stage } from "@/lib/domain/constants";
import { StageBadge } from "@/components/stage-badge";
import { formatDateTime } from "@/lib/utils";

/** A timeline entry as rendered. */
export type TimelineItem = {
  id: string;
  type: ActivityType;
  fromStage: Stage | null;
  toStage: Stage | null;
  message: string | null;
  createdAt: Date;
};

const ICONS: Record<ActivityType, typeof Pencil> = {
  CREATED: FilePlus2,
  STAGE_CHANGED: ArrowRight,
  UPDATED: Pencil,
  FOLLOW_UP_SET: BellRing,
  FOLLOW_UP_CLEARED: BellRing,
  IMPORTED: Upload,
};

/** Activity timeline, newest first. Stage changes are logged automatically. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <ol className="relative flex flex-col gap-4 border-l pl-5">
      {items.map((item) => {
        const Icon = ICONS[item.type];
        return (
          <li key={item.id} className="relative">
            <span className="absolute top-0.5 -left-[1.95rem] flex size-6 items-center justify-center rounded-full border bg-card">
              <Icon className="size-3.5 text-muted-foreground" aria-hidden />
            </span>
            {item.type === "STAGE_CHANGED" && item.fromStage && item.toStage ? (
              <p className="flex flex-wrap items-center gap-1.5 text-sm">
                <StageBadge stage={item.fromStage} />
                <ArrowRight className="size-3.5 text-muted-foreground" aria-label="to" />
                <StageBadge stage={item.toStage} />
              </p>
            ) : (
              <p className="text-sm">{item.message}</p>
            )}
            <time className="text-xs text-muted-foreground" dateTime={item.createdAt.toISOString()}>
              {formatDateTime(item.createdAt)} UTC
            </time>
          </li>
        );
      })}
    </ol>
  );
}
