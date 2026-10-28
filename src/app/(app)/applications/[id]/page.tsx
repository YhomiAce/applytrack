import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { DeleteButton } from "@/components/application/delete-button";
import { FollowUpForm } from "@/components/application/follow-up-form";
import { Markdown } from "@/components/application/markdown";
import { Timeline } from "@/components/application/timeline";
import { PageLoading } from "@/components/page-loading";
import { StageBadge } from "@/components/stage-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteApplicationAction } from "@/lib/actions/application-actions";
import { toIsoDate } from "@/lib/domain/application-schema";
import { SOURCE_LABELS, WORK_MODE_LABELS } from "@/lib/domain/constants";
import { loadApplicationOr404 } from "@/lib/load-application";
import { formatDate, formatSalary } from "@/lib/utils";

export const metadata: Metadata = { title: "Application" };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm">{children || "—"}</dd>
    </div>
  );
}

async function ApplicationView({ params }: { params: PageProps<"/applications/[id]">["params"] }) {
  const { id } = await params;
  const app = await loadApplicationOr404(id);
  const salary = formatSalary(app.salaryMin, app.salaryMax, app.currency);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Board
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{app.company}</h1>
          <p className="text-muted-foreground">{app.role}</p>
          <div className="mt-2">
            <StageBadge stage={app.stage} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/applications/${app.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil /> Edit
          </Link>
          <form action={deleteApplicationAction.bind(null, app.id)}>
            <DeleteButton />
          </form>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardContent className="pt-5">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Detail label="Location">{app.location}</Detail>
                <Detail label="Work mode">{WORK_MODE_LABELS[app.workMode]}</Detail>
                <Detail label="Salary">{salary}</Detail>
                <Detail label="Source">{SOURCE_LABELS[app.source]}</Detail>
                <Detail label="Applied">{app.appliedAt ? formatDate(app.appliedAt) : null}</Detail>
                <Detail label="Contact">
                  {app.contactName}
                  {app.contactEmail && (
                    <a href={`mailto:${app.contactEmail}`} className="block truncate text-primary hover:underline">
                      {app.contactEmail}
                    </a>
                  )}
                </Detail>
                {app.jobUrl && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Job posting</dt>
                    <dd className="mt-0.5 text-sm">
                      <a href={app.jobUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1 text-primary hover:underline">
                        <span className="truncate">{app.jobUrl}</span> <ExternalLink className="size-3.5 shrink-0" />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {app.notes.trim() ? <Markdown>{app.notes}</Markdown> : <p className="text-sm text-muted-foreground">No notes yet.</p>}
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Reminder</CardTitle>
            </CardHeader>
            <CardContent>
              <FollowUpForm id={app.id} followUpAt={toIsoDate(app.followUpAt)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={app.activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationPage(props: PageProps<"/applications/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <ApplicationView params={props.params} />
    </Suspense>
  );
}
