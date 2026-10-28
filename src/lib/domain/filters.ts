import { z } from "zod";
import { sourceSchema, stageSchema, workModeSchema } from "./constants";

/** Turns "" and missing query params into undefined before enum validation. */
const optionalEnum = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" || v === null || Array.isArray(v) ? undefined : v), schema.optional()).catch(undefined);

/** Board search/filter parameters, parsed from the URL query string. */
export const boardFiltersSchema = z.object({
  q: z
    .preprocess((v) => (typeof v === "string" ? v.trim().slice(0, 100) : undefined), z.string().optional())
    .transform((v) => v || undefined),
  stage: optionalEnum(stageSchema),
  workMode: optionalEnum(workModeSchema),
  source: optionalEnum(sourceSchema),
});

/** Validated board filters. Invalid values are silently dropped. */
export type BoardFilters = z.infer<typeof boardFiltersSchema>;

/** True when any filter is active. */
export function hasActiveFilters(filters: BoardFilters): boolean {
  return Boolean(filters.q || filters.stage || filters.workMode || filters.source);
}
