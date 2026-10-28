import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { ColumnChart, HorizontalBarChart } from "@/components/stats/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listForStats } from "@/lib/applications";
import { STAGE_LABELS } from "@/lib/domain/constants";
import { applicationsPerWeek, averageDaysPerStage, funnel, responseRate } from "@/lib/domain/stats";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Stats" };

const pct = (rate: number | null) => (rate === null ? "—" : `${Math.round(rate * 100)}%`);
const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

async function Stats() {
  const user = await requireUser();
  const apps = await listForStats(user.id);
  const weeks = applicationsPerWeek(apps, new Date(), 12);
  const steps = funnel(apps);
  const response = responseRate(apps);
  const days = averageDaysPerStage(apps);
  const offers = steps[steps.length - 1].count;
  const active = apps.filter((a) => !["REJECTED", "WITHDRAWN", "WISHLIST"].includes(a.stage)).length;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Stats</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Applications" value={String(apps.length)} hint={`${response.applied} applied`} />
        <StatTile label="In progress" value={String(active)} hint="Applied, screening, interview or offer" />
        <StatTile label="Response rate" value={pct(response.rate)} hint={`${response.responded} of ${response.applied} heard back`} />
        <StatTile label="Offers" value={String(offers)} hint={`${pct(steps[steps.length - 1].overallRate)} of applications`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications per week</CardTitle>
          <CardDescription>By applied date, last 12 weeks (weeks start Monday)</CardDescription>
        </CardHeader>
        <CardContent>
          <ColumnChart
            ariaLabel="Applications per week"
            data={weeks.map((w) => {
              const label = shortDate.format(new Date(`${w.weekStart}T00:00:00Z`));
              return { label, value: w.count, detail: `${w.count} application${w.count === 1 ? "" : "s"} (week of ${label})` };
            })}
          />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Funnel conversion</CardTitle>
            <CardDescription>Applications that reached each stage (skipped stages count as passed)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <HorizontalBarChart
              ariaLabel="Funnel conversion by stage"
              data={steps.map((s) => ({
                label: STAGE_LABELS[s.stage],
                value: s.count,
                display: `${s.count} · ${pct(s.overallRate)}`,
                detail: `${s.count} reached ${STAGE_LABELS[s.stage]} (${pct(s.overallRate)} of applied${s.stepRate === null ? "" : `, ${pct(s.stepRate)} of previous step`})`,
              }))}
            />
            <table className="w-full text-sm">
              <caption className="sr-only">Funnel conversion table</caption>
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 font-medium">Stage</th>
                  <th className="py-1 text-right font-medium">Reached</th>
                  <th className="py-1 text-right font-medium">From previous</th>
                  <th className="py-1 text-right font-medium">Of applied</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {steps.map((s) => (
                  <tr key={s.stage} className="border-t">
                    <td className="py-1.5">{STAGE_LABELS[s.stage]}</td>
                    <td className="py-1.5 text-right">{s.count}</td>
                    <td className="py-1.5 text-right">{s.stepRate === null ? "—" : pct(s.stepRate)}</td>
                    <td className="py-1.5 text-right">{pct(s.overallRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average days per stage</CardTitle>
            <CardDescription>Completed stays only, from the activity timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              ariaLabel="Average days spent in each stage"
              data={days.map((d) => ({
                label: STAGE_LABELS[d.stage],
                value: d.averageDays ?? 0,
                display: d.averageDays === null ? "no data" : `${d.averageDays} d`,
                detail:
                  d.averageDays === null
                    ? "No completed stays yet"
                    : `${d.averageDays} days on average (${d.samples} stay${d.samples === 1 ? "" : "s"})`,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<PageLoading label="Crunching your numbers…" />}>
      <Stats />
    </Suspense>
  );
}
