import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

/** A styled `<input>`. */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldClass, "h-9", className)} {...props} />;
}

/** A styled `<textarea>`. */
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldClass, "min-h-24", className)} {...props} />;
}

/** A styled native `<select>`. */
export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldClass, "h-9 pr-8", className)} {...props} />;
}

/** A styled `<label>`. */
export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium leading-none", className)} {...props} />;
}
