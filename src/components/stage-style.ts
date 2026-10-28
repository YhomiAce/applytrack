import type { Stage } from "@/lib/domain/constants";

/** Tailwind classes for each stage's accent dot / badge. */
export const STAGE_DOT: Record<Stage, string> = {
  WISHLIST: "bg-slate-400",
  APPLIED: "bg-sky-500",
  SCREENING: "bg-violet-500",
  INTERVIEW: "bg-amber-500",
  OFFER: "bg-emerald-500",
  REJECTED: "bg-rose-500",
  WITHDRAWN: "bg-zinc-500",
};
