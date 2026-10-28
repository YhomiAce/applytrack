import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** A bordered surface. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border bg-card text-card-foreground shadow-xs", className)} {...props} />;
}

/** Card header area. */
export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />;
}

/** Card title. */
export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-base font-semibold leading-tight", className)} {...props} />;
}

/** Card description text. */
export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/** Card body. */
export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
