import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicationForm } from "@/components/application/application-form";
import { PageLoading } from "@/components/page-loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateApplicationAction } from "@/lib/actions/application-actions";
import { toIsoDate } from "@/lib/domain/application-schema";
import { loadApplicationOr404 } from "@/lib/load-application";

export const metadata: Metadata = { title: "Edit application" };

async function EditForm({ params }: { params: PageProps<"/applications/[id]/edit">["params"] }) {
  const { id } = await params;
  const app = await loadApplicationOr404(id);
  return (
    <ApplicationForm
      action={updateApplicationAction.bind(null, app.id)}
      submitLabel="Save changes"
      cancelHref={`/applications/${app.id}`}
      initial={{
        company: app.company,
        role: app.role,
        jobUrl: app.jobUrl ?? "",
        location: app.location ?? "",
        workMode: app.workMode,
        salaryMin: app.salaryMin?.toString() ?? "",
        salaryMax: app.salaryMax?.toString() ?? "",
        currency: app.currency,
        source: app.source,
        stage: app.stage,
        appliedAt: toIsoDate(app.appliedAt),
        followUpAt: toIsoDate(app.followUpAt),
        contactName: app.contactName ?? "",
        contactEmail: app.contactEmail ?? "",
        notes: app.notes,
      }}
    />
  );
}

export default function EditApplicationPage(props: PageProps<"/applications/[id]/edit">) {
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle className="text-xl">Edit application</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PageLoading />}>
          <EditForm params={props.params} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
