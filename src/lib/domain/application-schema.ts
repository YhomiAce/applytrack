import { z } from "zod";
import { sourceSchema, stageSchema, workModeSchema } from "./constants";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Empty strings (from forms or CSV cells) become `null`. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** A calendar date as `YYYY-MM-DD`, stored as UTC midnight. */
export const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || (ISO_DATE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`))), {
    message: "Use a YYYY-MM-DD date",
  })
  .nullable()
  .optional()
  .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null));

const optionalMoney = z
  .union([z.string(), z.number()])
  .nullable()
  .optional()
  .transform((v, ctx) => {
    if (v === null || v === undefined) return null;
    const raw = typeof v === "number" ? String(v) : v.replace(/[\s,$€£]/g, "");
    if (raw === "") return null;
    let multiplier = 1;
    let digits = raw;
    if (/k$/i.test(digits)) {
      multiplier = 1000;
      digits = digits.slice(0, -1);
    }
    const n = Number(digits);
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: "Enter a positive number" });
      return z.NEVER;
    }
    return Math.round(n * multiplier);
  });

/**
 * The editable fields of an application. Shared by the form server actions
 * and the CSV importer so both validate identically.
 */
export const applicationInputSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required").max(120),
    role: z.string().trim().min(1, "Role is required").max(160),
    jobUrl: optionalText(2048).refine((v) => v === null || /^https?:\/\//i.test(v), {
      message: "Job URL must start with http:// or https://",
    }),
    location: optionalText(120),
    workMode: workModeSchema.default("ONSITE"),
    salaryMin: optionalMoney,
    salaryMax: optionalMoney,
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code")
      .or(z.literal("").transform(() => "USD"))
      .default("USD"),
    source: sourceSchema.default("OTHER"),
    stage: stageSchema.default("WISHLIST"),
    appliedAt: optionalDate,
    contactName: optionalText(120),
    contactEmail: optionalText(254).refine((v) => v === null || z.email().safeParse(v).success, {
      message: "Enter a valid email",
    }),
    notes: z.string().max(20_000).optional().default(""),
    followUpAt: optionalDate,
  })
  .refine((v) => v.salaryMin === null || v.salaryMax === null || v.salaryMin <= v.salaryMax, {
    message: "Minimum salary can't be above the maximum",
    path: ["salaryMax"],
  });

/** Raw (pre-validation) application input. */
export type ApplicationInputRaw = z.input<typeof applicationInputSchema>;
/** Validated application input, ready for Prisma. */
export type ApplicationInput = z.output<typeof applicationInputSchema>;

/** Formats a stored date as `YYYY-MM-DD` (or empty string). */
export function toIsoDate(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}
