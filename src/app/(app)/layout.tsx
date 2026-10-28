import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { NavLinks, NavLinksView } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="size-6" />
            <span className="hidden sm:inline">ApplyTrack</span>
          </Link>
          <Suspense fallback={<NavLinksView pathname={null} />}>
            <NavLinks />
          </Suspense>
          <div className="ml-auto flex items-center gap-1">
            <Link href="/applications/new" className={buttonVariants({ size: "sm" })}>
              <Plus /> <span className="hidden sm:inline">New application</span>
            </Link>
            <ThemeToggle />
            <Suspense fallback={<div className="size-9" />}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
