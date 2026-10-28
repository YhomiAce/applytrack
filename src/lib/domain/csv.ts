import Papa from "papaparse";
import {
  SOURCE_LABELS,
  STAGE_LABELS,
  WORK_MODE_LABELS,
  parseEnumLoose,
  type Source,
  type Stage,
  type WorkMode,
} from "./constants";
import {
  applicationInputSchema,
  toIsoDate,
  type ApplicationInput,
} from "./application-schema";

/** CSV columns, in export order. Header names are what users see in a spreadsheet. */
export const CSV_COLUMNS = [
  { key: "company", header: "Company" },
  { key: "role", header: "Role" },
  { key: "stage", header: "Stage" },
  { key: "jobUrl", header: "Job URL" },
  { key: "location", header: "Location" },
  { key: "workMode", header: "Work mode" },
  { key: "salaryMin", header: "Salary min" },
  { key: "salaryMax", header: "Salary max" },
  { key: "currency", header: "Currency" },
  { key: "source", header: "Source" },
  { key: "appliedAt", header: "Applied date" },
  { key: "followUpAt", header: "Follow-up date" },
  { key: "contactName", header: "Contact name" },
  { key: "contactEmail", header: "Contact email" },
  { key: "notes", header: "Notes" },
] as const;

type CsvKey = (typeof CSV_COLUMNS)[number]["key"];

/** The application fields that are exported. */
export type ExportableApplication = Pick<ApplicationInput, CsvKey>;

/** Maximum rows accepted in one import. */
export const MAX_IMPORT_ROWS = 2000;

/** One rejected CSV row (1-based line number, counting the header as line 1). */
export type CsvRowError = { line: number; message: string };

/** Outcome of parsing an import file. */
export type CsvParseResult = { rows: ApplicationInput[]; errors: CsvRowError[] };

/**
 * Neutralises spreadsheet formula injection: cells starting with = + - @ (or a
 * tab / carriage return) are prefixed with a single quote.
 */
function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** Serializes applications to CSV (RFC 4180, CRLF line endings, header row). */
export function serializeApplications(apps: ExportableApplication[]): string {
  const data = apps.map((app) =>
    CSV_COLUMNS.map(({ key }) => {
      const value = app[key];
      switch (key) {
        case "stage":
          return STAGE_LABELS[value as Stage];
        case "workMode":
          return WORK_MODE_LABELS[value as WorkMode];
        case "source":
          return SOURCE_LABELS[value as Source];
        case "appliedAt":
        case "followUpAt":
          return toIsoDate(value as Date | null);
        default:
          return value === null || value === undefined ? "" : safeCell(String(value));
      }
    }),
  );
  return Papa.unparse(
    { fields: CSV_COLUMNS.map((c) => c.header), data },
    { newline: "\r\n", quotes: false },
  );
}

const headerToKey = new Map<string, CsvKey>(
  CSV_COLUMNS.flatMap(({ key, header }) => [
    [header.toLowerCase(), key],
    [key.toLowerCase(), key],
  ]),
);

function normaliseHeader(header: string): string {
  return header.replace(/^﻿/, "").trim().toLowerCase();
}

function unescapeCell(value: string): string {
  return /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value;
}

/**
 * Parses an import CSV. Headers may be the export labels ("Applied date") or
 * field names ("appliedAt"), in any order; unknown columns are ignored. Stage,
 * work mode and source accept labels or codes. Each row is validated with the
 * same schema as the form; invalid rows are reported, valid rows returned.
 */
export function parseApplicationsCsv(text: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normaliseHeader,
  });

  const errors: CsvRowError[] = [];
  const fields = parsed.meta.fields ?? [];
  const mapped = fields.map((f) => headerToKey.get(f));
  if (!mapped.includes("company") || !mapped.includes("role")) {
    return {
      rows: [],
      errors: [{ line: 1, message: 'The header row must include "Company" and "Role" columns' }],
    };
  }

  if (parsed.data.length > MAX_IMPORT_ROWS) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Too many rows (max ${MAX_IMPORT_ROWS})` }],
    };
  }

  const rows: ApplicationInput[] = [];
  parsed.data.forEach((record, index) => {
    const line = index + 2;
    const raw: Record<string, string> = {};
    for (const [header, value] of Object.entries(record)) {
      const key = headerToKey.get(header);
      if (key && typeof value === "string") raw[key] = unescapeCell(value.trim());
    }

    const enumIssues: string[] = [];
    const pickEnum = <T extends string>(field: CsvKey, labels: Record<T, string>): T | undefined => {
      const value = raw[field];
      if (!value) return undefined;
      const code = parseEnumLoose(value, labels);
      if (!code) enumIssues.push(`unknown ${field} "${value}"`);
      return code;
    };

    const candidate: Record<string, unknown> = {
      ...raw,
      stage: pickEnum("stage", STAGE_LABELS),
      workMode: pickEnum("workMode", WORK_MODE_LABELS),
      source: pickEnum("source", SOURCE_LABELS),
    };

    if (enumIssues.length > 0) {
      errors.push({ line, message: enumIssues.join("; ") });
      return;
    }

    const result = applicationInputSchema.safeParse(candidate);
    if (!result.success) {
      errors.push({
        line,
        message: result.error.issues
          .map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`)
          .join("; "),
      });
      return;
    }
    rows.push(result.data);
  });

  return { rows, errors };
}
