import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import {
  SOURCES,
  SOURCE_LABELS,
  STAGES,
  STAGE_LABELS,
  WORK_MODES,
  WORK_MODE_LABELS,
} from "@/lib/domain/constants";
import { hasActiveFilters, type BoardFilters } from "@/lib/domain/filters";

/** Search box and stage / work-mode / source filters. A plain GET form, so it works without JS. */
export function BoardFiltersForm({ filters }: { filters: BoardFilters }) {
  return (
    <form method="get" action="/" role="search" className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={filters.q} placeholder="Search company, role, notes…" className="pl-8" aria-label="Search" />
      </div>
      <Select name="stage" defaultValue={filters.stage ?? ""} aria-label="Stage" className="w-auto">
        <option value="">All stages</option>
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </Select>
      <Select name="workMode" defaultValue={filters.workMode ?? ""} aria-label="Work mode" className="w-auto">
        <option value="">Any work mode</option>
        {WORK_MODES.map((m) => (
          <option key={m} value={m}>
            {WORK_MODE_LABELS[m]}
          </option>
        ))}
      </Select>
      <Select name="source" defaultValue={filters.source ?? ""} aria-label="Source" className="w-auto">
        <option value="">Any source</option>
        {SOURCES.map((s) => (
          <option key={s} value={s}>
            {SOURCE_LABELS[s]}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary">
        Apply
      </Button>
      {hasActiveFilters(filters) && (
        <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <X className="size-4" /> Clear
        </Link>
      )}
    </form>
  );
}
