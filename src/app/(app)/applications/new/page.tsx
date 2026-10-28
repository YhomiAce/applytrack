import type { Metadata } from "next";
import { ApplicationForm } from "@/components/application/application-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createApplicationAction } from "@/lib/actions/application-actions";

export const metadata: Metadata = { title: "New application" };

export default function NewApplicationPage() {
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle className="text-xl">New application</CardTitle>
      </CardHeader>
      <CardContent>
        <ApplicationForm action={createApplicationAction} submitLabel="Add application" cancelHref="/" />
      </CardContent>
    </Card>
  );
}
