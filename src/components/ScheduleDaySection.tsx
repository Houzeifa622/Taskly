"use client";

import type { Category } from "@/lib/db";
import type { Occurrence } from "@/lib/schedule";
import {
  durationInMinutes,
  formatMinutes,
  startOfDay,
  weekdayIndex,
  WEEKDAY_LABELS,
} from "@/lib/dates";
import ScheduleEventRow from "@/components/ScheduleEventRow";

const ADD_BUTTON =
  "mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-caption font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/40 hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none";

interface Props {
  date: Date;
  occurrences: Occurrence[];
  categoriesById: Map<number, Category>;
  conflicts: Set<string>;
  isToday: boolean;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => Promise<void>;
  onCreate: (date: Date) => void;
  /** Glisser-déposer : reçoit la date cible du dépôt. */
  onDropOccurrence?: (occurrenceKey: string, target: Date) => void;
  onDragStart?: (occurrence: Occurrence) => void;
  onDragEnd?: () => void;
  draggedKey?: string | null;
  compact?: boolean;
  emptyMessage?: string;
}

/** Bloc d'une journée : en-tête (jour, totaux) puis les créneaux empilés. */
export default function ScheduleDaySection({
  date,
  occurrences,
  categoriesById,
  conflicts,
  isToday,
  onEdit,
  onDelete,
  onCreate,
  onDropOccurrence,
  onDragStart,
  onDragEnd,
  draggedKey = null,
  compact = false,
  emptyMessage = "Journée libre — rien de planifié pour le moment.",
}: Props) {
  const label = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const timed = occurrences.filter((occurrence) => !occurrence.allDay);
  const totalMinutes = timed.reduce(
    (sum, occurrence) =>
      sum + durationInMinutes(occurrence.start, occurrence.end),
    0
  );
  const conflictCount = occurrences.filter((occurrence) =>
    conflicts.has(occurrence.key)
  ).length;

  return (
    <section
      aria-label={label}
      onDragOver={
        onDropOccurrence
          ? (event) => {
              if (!draggedKey) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }
          : undefined
      }
      onDrop={
        onDropOccurrence
          ? (event) => {
              event.preventDefault();
              const key =
                draggedKey || event.dataTransfer.getData("text/plain");
              if (key) onDropOccurrence(key, startOfDay(date));
            }
          : undefined
      }
      className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors ${
        isToday ? "border-primary/45 bg-primary-soft/25" : "border-border"
      }`}
    >
      <header
        className={`flex items-center gap-3 border-b border-border ${
          compact ? "px-3 py-2.5" : "px-4 py-3"
        }`}
      >
        <span
          aria-hidden
          className={`flex shrink-0 flex-col items-center justify-center rounded-xl ${
            compact ? "h-9 w-9" : "h-11 w-11"
          } ${isToday ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
        >
          <span className="text-caption font-semibold uppercase leading-none">
            {WEEKDAY_LABELS[weekdayIndex(date)]}
          </span>
          <span
            className={`font-bold tabular-nums leading-tight ${
              compact ? "text-body" : "text-heading"
            }`}
          >
            {date.getDate()}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate font-semibold capitalize text-foreground ${
              compact ? "text-label" : "text-body"
            }`}
          >
            {label}
          </p>
          <p className="text-caption text-muted-foreground">
            {occurrences.length === 0
              ? "Aucun créneau"
              : `${occurrences.length} ${
                  occurrences.length > 1 ? "créneaux" : "créneau"
                }${totalMinutes > 0 ? ` · ${formatMinutes(totalMinutes)}` : ""}`}
          </p>
        </div>

        {conflictCount > 0 && (
          <span className="shrink-0 rounded-full bg-warning/15 px-2.5 py-1 text-caption font-medium text-warning">
            {conflictCount} conflit{conflictCount > 1 ? "s" : ""}
          </span>
        )}

        {isToday && (
          <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-caption font-medium text-primary-foreground">
            Aujourd&apos;hui
          </span>
        )}
      </header>

      <div className="px-4 py-3 sm:px-5">
        {occurrences.length === 0 ? (
          <p className="mb-2 text-caption text-muted-opacity">{emptyMessage}</p>
        ) : (
          <ul className="-mx-4 divide-y divide-border sm:-mx-5">
            {occurrences.map((occurrence) => (
              <ScheduleEventRow
                key={occurrence.key}
                occurrence={occurrence}
                category={
                  occurrence.event.categoryId !== null
                    ? categoriesById.get(occurrence.event.categoryId)
                    : undefined
                }
                conflict={conflicts.has(occurrence.key)}
                onEdit={onEdit}
                onDelete={onDelete}
                draggable={onDropOccurrence !== undefined}
                onDragStart={(occurrence) => onDragStart?.(occurrence)}
                onDragEnd={() => onDragEnd?.()}
              />
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => onCreate(date)}
          className={ADD_BUTTON}
        >
          <span aria-hidden className="text-base leading-none">
            +
          </span>
          Ajouter un créneau
        </button>
      </div>
    </section>
  );
}
