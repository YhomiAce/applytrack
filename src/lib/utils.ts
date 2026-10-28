import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class names, letting later classes win. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formats a salary range like "€85k – €100k". */
export function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  if (min === null && max === null) return null;
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        notation: "compact",
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(n);
    } catch {
      return `${currency} ${n.toLocaleString("en")}`;
    }
  };
  if (min !== null && max !== null) return `${fmt(min)} – ${fmt(max)}`;
  return min !== null ? `${fmt(min)}+` : `up to ${fmt(max as number)}`;
}

/** Formats a stored UTC date as e.g. "Oct 28, 2026". */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

/** Formats a timestamp as e.g. "Oct 28, 2026, 2:15 PM" (UTC). */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);
}
