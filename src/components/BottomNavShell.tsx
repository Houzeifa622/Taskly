"use client";

import Link from "next/link";
import { useState } from "react";
import QuickAddSheet from "@/components/QuickAddSheet";
import {
  BookIcon,
  CalendarIcon,
  CheckSquareIcon,
  PlusIcon,
} from "@/components/icons";

const TABS = [
  { href: "/categories", label: "Carnet", icon: BookIcon },
  { href: "/tasks", label: "Tâches", icon: CheckSquareIcon },
  { href: "/schedule", label: "Agenda", icon: CalendarIcon },
];

function isActive(pathname: string | null | undefined, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Barre de navigation basse (mobile / PWA) avec bouton d'ajout rapide.
 * Le chemin courant est optionnel : le rendu de secours ne le connaît pas.
 */
export default function BottomNavShell({
  pathname,
}: {
  pathname?: string | null;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(pathname, tab.href);

            return (
              <li key={tab.href} className="flex flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-caption leading-none font-medium">
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}

          <li className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="Ajouter"
              className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95 focus:ring-4 focus:ring-primary/30 focus:outline-none"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          </li>
        </ul>
      </nav>

      <QuickAddSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
