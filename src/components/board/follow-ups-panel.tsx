"use client";

import Link from "next/link";
import { useTransition } from "react";
import { BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageBadge } from "@/components/stage-badge";
import { completeFollowUpAction } from "@/lib/actions/application-actions";
import type { Stage } from "@/lib/domain/constants";

/** A due follow-up as shown in the panel. */
export type DueFollowUp = {
  id: string;
  company: string;
  role: string;
  stage: Stage;
  followUpAt: string;
  overdueDays: number;
};

function dueLabel(days: number): string {
  if (days <= 0) return "Due today";
  return days === 1 ? "1 day overdue" : `${days} days overdue`;
}

/** "Due follow-ups" panel on the dashboard, with a one-click "done". */
export function FollowUpsPanel({ items }: { items: DueFollowUp[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-4 text-amber-500" /> Due follow-ups
          <span className="rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing due. Nice and tidy.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <li key={item.id} className="flex min-w-0 items-center gap-3 rounded-lg border p-2.5">
                <div className="min-w-0 flex-1">
                  <Link href={`/applications/${item.id}`} className="block truncate text-sm font-medium hover:underline">
                    {item.company} · <span className="font-normal text-muted-foreground">{item.role}</span>
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <StageBadge stage={item.stage} />
                    <span className={item.overdueDays > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                      {dueLabel(item.overdueDays)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => startTransition(async () => void (await completeFollowUpAction(item.id)))}
                  aria-label={`Mark follow-up with ${item.company} as done`}
                >
                  <Check /> Done
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
