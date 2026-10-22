import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import ThemeToggle from "@/components/ThemeToggle";

export default function HeaderShell({
  pathname,
}: {
  pathname?: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-lg outline-none"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="text-subheading font-semibold tracking-tight text-foreground">
            Taskly
          </span>
        </Link>

        <HeaderNav pathname={pathname} />

        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
