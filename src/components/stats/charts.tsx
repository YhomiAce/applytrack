"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

/** One bar: a label, a value, and an optional preformatted value for labels/tooltips. */
export type BarDatum = { label: string; value: number; display?: string; detail?: string };

const axisTick = { fill: "var(--chart-text)", fontSize: 12 };

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const datum = payload?.[0]?.payload as BarDatum | undefined;
  if (!active || !datum) return null;
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{datum.label}</p>
      <p className="text-muted-foreground">{datum.detail ?? datum.display ?? datum.value}</p>
    </div>
  );
}

/** Vertical single-series bar chart (e.g. applications per week). */
export function ColumnChart({ data, ariaLabel }: { data: BarDatum[]; ariaLabel: string }) {
  return (
    <div className="h-64 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
          <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={ChartTooltip} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal single-series bar chart with direct value labels (funnel, days per stage). */
export function HorizontalBarChart({ data, ariaLabel }: { data: BarDatum[]; ariaLabel: string }) {
  return (
    <div className="w-full" style={{ height: Math.max(160, data.length * 44) }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 84, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="label" tick={axisTick} tickLine={false} axisLine={false} width={84} />
          <Tooltip content={ChartTooltip} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={28}>
            <LabelList dataKey="display" position="right" style={{ fill: "var(--foreground)", fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
