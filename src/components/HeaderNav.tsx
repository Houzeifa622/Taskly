import Link from "next/link";
import { BookIcon, CalendarIcon, CheckSquareIcon } from "@/components/icons";

export const NAV_ITEMS = [
  { href: "/categories", label: "Carnet", icon: BookIcon },
  { href: "/tasks", label: "Tâches", icon: CheckSquareIcon },
  { href: "/schedule", label: "Emploi du temps", icon: CalendarIcon },
];

/**
 * Navigation principale. Le chemin courant est optionnel : le rendu de
 * secours (fallback Suspense) ne le connaît pas encore.
 */
export default function HeaderNav({ pathname }: { pathname?: string | null }) {
  return (
    <nav className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1 sm:mx-0 sm:justify-end sm:overflow-visible sm:px-0">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-body font-medium transition-colors ${
              active
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
