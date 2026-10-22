"use client";

import { useId, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Formulaire repliable : la page reste courte, le formulaire s'ouvre à la
 * demande (et s'ouvre automatiquement s'il a été demandé par le bouton
 * d'ajout rapide).
 */
export default function CollapsibleForm({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-card-hover sm:px-5"
      >
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            {icon}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block text-subheading font-semibold text-foreground">
            {title}
          </span>
          {subtitle && (
            <span className="mt-0.5 block text-caption text-muted-foreground">
              {subtitle}
            </span>
          )}
        </span>

        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-muted-opacity transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            id={panelId}
            className="border-t border-border px-4 py-5 sm:px-5"
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
