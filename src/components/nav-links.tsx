"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileSpreadsheet, KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Board", icon: KanbanSquare },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/import-export", label: "Import / Export", icon: FileSpreadsheet },
] as const;

/** Primary navigation with the active route highlighted. */
export function NavLinks() {
  return <NavLinksView pathname={usePathname()} />;
}

/** Navigation markup; `pathname` null renders without an active item (prerendered fallback). */
export function NavLinksView({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Main">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active =
          pathname !== null &&
          (href === "/" ? pathname === "/" || pathname.startsWith("/applications") : pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
