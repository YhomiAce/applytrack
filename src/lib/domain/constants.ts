import { z } from "zod";

/** Board columns, in display order. */
export const STAGES = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type Stage = (typeof STAGES)[number];
export const stageSchema = z.enum(STAGES);

export const STAGE_LABELS: Record<Stage, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

/** Stages that form the hiring funnel, in order (terminal stages excluded). */
export const FUNNEL_STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"] as const satisfies readonly Stage[];

export const WORK_MODES = ["ONSITE", "HYBRID", "REMOTE"] as const;
export type WorkMode = (typeof WORK_MODES)[number];
export const workModeSchema = z.enum(WORK_MODES);
export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

export const SOURCES = ["LINKEDIN", "REFERRAL", "COMPANY_SITE", "JOB_BOARD", "RECRUITER", "OTHER"] as const;
export type Source = (typeof SOURCES)[number];
export const sourceSchema = z.enum(SOURCES);
export const SOURCE_LABELS: Record<Source, string> = {
  LINKEDIN: "LinkedIn",
  REFERRAL: "Referral",
  COMPANY_SITE: "Company site",
  JOB_BOARD: "Job board",
  RECRUITER: "Recruiter",
  OTHER: "Other",
};

/**
 * Looks up an enum value from either its code (`LINKEDIN`) or its label
 * (`LinkedIn`), case-insensitively. Used by the CSV importer.
 */
export function parseEnumLoose<T extends string>(
  value: string,
  labels: Record<T, string>,
): T | undefined {
  const needle = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (!needle) return undefined;
  for (const [code, label] of Object.entries(labels) as [T, string][]) {
    if (code.toLowerCase().replace(/_/g, "") === needle) return code;
    if (label.toLowerCase().replace(/[\s_-]+/g, "") === needle) return code;
  }
  return undefined;
}
