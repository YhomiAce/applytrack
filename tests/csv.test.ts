import { describe, expect, it } from "vitest";
import { parseApplicationsCsv, serializeApplications, type ExportableApplication } from "@/lib/domain/csv";

const sample: ExportableApplication = {
  company: "Acme, Inc.",
  role: "Senior Engineer",
  stage: "INTERVIEW",
  jobUrl: "https://acme.example/jobs/1",
  location: "Berlin",
  workMode: "HYBRID",
  salaryMin: 90000,
  salaryMax: 110000,
  currency: "EUR",
  source: "REFERRAL",
  appliedAt: new Date("2026-09-14T00:00:00Z"),
  followUpAt: null,
  contactName: "Dana \"DJ\" Jones",
  contactEmail: "dana@acme.example",
  notes: "Line one\nLine two",
};

describe("serializeApplications", () => {
  it("writes a header row and human-readable values", () => {
    const csv = serializeApplications([sample]);
    const [header, ...rest] = csv.split("\r\n");
    expect(header).toBe(
      "Company,Role,Stage,Job URL,Location,Work mode,Salary min,Salary max,Currency,Source,Applied date,Follow-up date,Contact name,Contact email,Notes",
    );
    const body = rest.join("\r\n");
    expect(body).toContain('"Acme, Inc."');
    expect(body).toContain("Interview,");
    expect(body).toContain("Hybrid");
    expect(body).toContain("Referral");
    expect(body).toContain("2026-09-14");
    expect(body).toContain('"Dana ""DJ"" Jones"');
  });

  it("neutralises formula injection", () => {
    const csv = serializeApplications([{ ...sample, company: "=HYPERLINK(\"x\")" }]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});

describe("parseApplicationsCsv", () => {
  it("round-trips an export", () => {
    const { rows, errors } = parseApplicationsCsv(serializeApplications([sample]));
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ ...sample, followUpAt: null });
  });

  it("accepts field-name headers, codes, a BOM and loose money", () => {
    const text = "﻿company,role,stage,source,workMode,salaryMin,salaryMax\nGlobex,PM,screening,linkedin,remote,\"$85,000\",95k\n";
    const { rows, errors } = parseApplicationsCsv(text);
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      company: "Globex",
      role: "PM",
      stage: "SCREENING",
      source: "LINKEDIN",
      workMode: "REMOTE",
      salaryMin: 85000,
      salaryMax: 95000,
      currency: "USD",
    });
  });

  it("reports invalid rows with line numbers and keeps the valid ones", () => {
    const text = [
      "Company,Role,Stage,Applied date,Job URL",
      "Good Co,Dev,Applied,2026-10-01,",
      ",Dev,Applied,,",
      "Bad Co,Dev,Pending,,",
      "Worse Co,Dev,Applied,01/10/2026,ftp://x",
    ].join("\n");
    const { rows, errors } = parseApplicationsCsv(text);
    expect(rows.map((r) => r.company)).toEqual(["Good Co"]);
    expect(errors.map((e) => e.line)).toEqual([3, 4, 5]);
    expect(errors[1].message).toContain('unknown stage "Pending"');
    expect(errors[2].message).toContain("appliedAt");
    expect(errors[2].message).toContain("jobUrl");
  });

  it("requires Company and Role columns", () => {
    const { rows, errors } = parseApplicationsCsv("Name,Title\nA,B\n");
    expect(rows).toEqual([]);
    expect(errors[0].line).toBe(1);
  });
});
