import { Badge } from "@/components/ui/badge";
import { STAGE_LABELS, type Stage } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";
import { STAGE_DOT } from "./stage-style";

/** A badge showing an application's stage with its colour dot. */
export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <Badge className={cn("text-foreground", className)}>
      <span className={cn("size-2 rounded-full", STAGE_DOT[stage])} aria-hidden />
      {STAGE_LABELS[stage]}
    </Badge>
  );
}
