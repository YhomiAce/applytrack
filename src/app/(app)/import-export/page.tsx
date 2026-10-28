import type { Metadata } from "next";
import { Download } from "lucide-react";
import { ImportForm } from "@/components/import-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CSV_COLUMNS } from "@/lib/domain/csv";

export const metadata: Metadata = { title: "Import / Export" };

export default function ImportExportPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>Download every application as a CSV file (opens in Excel, Numbers, Google Sheets).</CardDescription>
        </CardHeader>
        <CardContent>
          {/* A plain link: the route handler streams the file as an attachment. */}
          <a href="/api/export" className={buttonVariants()} download>
            <Download /> Download CSV
          </a>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Import</CardTitle>
          <CardDescription>Add applications from a CSV. Invalid rows are skipped and reported.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImportForm />
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>CSV format</CardTitle>
          <CardDescription>
            The header row needs at least <strong>Company</strong> and <strong>Role</strong>; other columns are optional and can be in any order.
            Stage, work mode and source accept labels (&quot;Interview&quot;, &quot;LinkedIn&quot;) or codes (&quot;INTERVIEW&quot;). Dates use YYYY-MM-DD.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-nowrap">
            {CSV_COLUMNS.map((c) => c.header).join(",")}
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
