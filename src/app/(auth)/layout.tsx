import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between p-4">
        <span className="flex items-center gap-2 font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="size-6" />
          ApplyTrack
        </span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">{children}</main>
    </div>
  );
}
