"use client";

import { useRemoveAnimation } from "@/lib/useRemoveAnimation";
import type { Category, ScheduleEvent } from "@/lib/db";
import { ClockIcon, RepeatIcon, TrashIcon } from "@/components/icons";

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
};

const BADGE_CLASS =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium";

export function formatDuration(event: ScheduleEvent): string {
  const minutes = Math.max(
    0,
    Math.round(
      (event.endDateTime.getTime() - event.startDateTime.getTime()) / 60000
    )
  );
  if (minutes === 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest.toString().padStart(2, "0")}` : `${hours} h`;
}

interface Props {
  event: ScheduleEvent;
  category?: Category;
  index: number;
  onDelete: (event: ScheduleEvent) => void;
}

export default function ScheduleEventItem({
  event,
  category,
  index,
  onDelete,
}: Props) {
  const { removing, remove } = useRemoveAnimation();

  async function handleDelete() {
    await remove(() => onDelete(event));
  }

  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);

  return (
    <li
      style={{
        animationDelay: `${Math.min(index, 10) * 35}ms`,
        ...(category?.color
          ? { borderLeftColor: category.color, borderLeftWidth: "4px" }
          : {}),
      }}
      className={`group relative rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-all duration-200 hover:border-primary/30 animate-fade-up ${
        removing ? "scale-95 opacity-0" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-body font-medium text-foreground">
            {event.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <ClockIcon className="h-3.5 w-3.5" />
              {start.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" – "}
              {end.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {formatDuration(event) && <span>· {formatDuration(event)}</span>}
            {event.recurrence && event.recurrence !== "none" && (
              <span className={`${BADGE_CLASS} bg-muted text-muted-foreground`}>
                <RepeatIcon className="h-3 w-3" />
                {RECURRENCE_LABELS[event.recurrence]}
              </span>
            )}
            {category && (
              <span className={`${BADGE_CLASS} bg-muted text-muted-foreground`}>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: category.color ?? "#6366f1" }}
                />
                {category.name}
              </span>
            )}
          </p>
          {event.note && (
            <p className="mt-1.5 text-caption text-muted-opacity">{event.note}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleDelete}
          className="shrink-0 rounded-lg p-1.5 text-muted-opacity transition-colors hover:bg-danger-soft hover:text-danger focus:ring-4 focus:ring-danger/20 focus:outline-none"
          aria-label={`Supprimer ${event.title}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
