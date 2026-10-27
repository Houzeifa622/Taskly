"use client";

import { useId, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

type Tone = "danger" | "primary" | "info" | "muted" | "success";

const TONES: Record<Tone, string> = {
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary-soft text-primary",
  info: "bg-info/10 text-info",
  muted: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
};

interface Props {
  title: string;
  count: number;
  tone?: Tone;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** Section repliable de la liste (En retard, Aujourd'hui, Terminées…). */
export default function TaskSection({
  title,
  count,
  tone = "muted",
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-left transition-colors hover:bg-muted/50 focus:ring-4 focus:ring-primary/20 focus:outline-none"
      >
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-muted-opacity transition-transform duration-200 ${
            open ? "" : "-rotate-90"
          }`}
        />
        <span className="text-caption font-semibold tracking-wide uppercase text-muted-foreground">
          {title}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-caption font-semibold tabular-nums ${TONES[tone]}`}
        >
          {count}
        </span>
      </button>

      <div id={panelId} hidden={!open} className="mt-1.5">
        {children}
      </div>
    </section>
  );
}
