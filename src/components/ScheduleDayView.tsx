"use client";

import type { Category } from "@/lib/db";
import type { Occurrence } from "@/lib/schedule";
import { formatMinutes, durationInMinutes, formatTime } from "@/lib/dates";
import { useNow } from "@/lib/useNow";
import ScheduleEventRow from "@/components/ScheduleEventRow";
import { AlertTriangleIcon, ClockIcon, SearchIcon } from "@/components/icons";

interface Props {
  date: Date;
  occurrences: Occurrence[];
  categoriesById: Map<number, Category>;
  conflicts: Set<string>;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => Promise<void>;
  onCreate: (date: Date) => void;
}

const NOW_LABEL =
  "flex items-center gap-2 py-1 text-caption font-semibold uppercase text-danger";

/** Vue « Ma journée » : la journée heure par heure, avec la ligne « maintenant ». */
export default function ScheduleDayView({
  date,
  occurrences,
  categoriesById,
  conflicts,
  onEdit,
  onDelete,
  onCreate,
}: Props) {
  const now = useNow();
  const isToday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  const allDay = occurrences.filter((occurrence) => occurrence.allDay);
  const timed = occurrences.filter((occurrence) => !occurrence.allDay);

  const totalMinutes = timed.reduce(
    (sum, occurrence) =>
      sum + durationInMinutes(occurrence.start, occurrence.end),
    0
  );

  const next = isToday
    ? timed.find((occurrence) => occurrence.start.getTime() > now.getTime())
    : undefined;
  const current = isToday
    ? timed.find(
        (occurrence) =>
          occurrence.start.getTime() <= now.getTime() &&
          occurrence.end.getTime() > now.getTime()
      )
    : undefined;

  const minutesUntilNext = next
    ? Math.max(0, Math.round((next.start.getTime() - now.getTime()) / 60000))
    : 0;

  // Position de la ligne « maintenant » dans la liste des créneaux.
  const nowIndex = timed.findIndex(
    (occurrence) => occurrence.start.getTime() > now.getTime()
  );
  const nowPosition = isToday ? (nowIndex === -1 ? timed.length : nowIndex) : -1;

  const conflictsCount = occurrences.filter((occurrence) =>
    conflicts.has(occurrence.key)
  ).length;

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-caption uppercase text-muted-foreground">Planifié</p>
          <p className="mt-0.5 text-heading font-semibold tabular-nums text-foreground">
            {totalMinutes > 0 ? formatMinutes(totalMinutes) : "—"}
          </p>
          <p className="text-caption text-muted-foreground">
            {timed.length} créneau{timed.length > 1 ? "x" : ""} minuté
            {timed.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-caption uppercase text-muted-foreground">
            En cours
          </p>
          <p className="mt-0.5 truncate text-body font-semibold text-foreground">
            {isToday ? (current?.event.title ?? "—") : "—"}
          </p>
          {isToday && current && (
            <p className="flex items-center gap-1 text-caption text-muted-foreground">
              <ClockIcon className="h-3 w-3" />
              jusqu&apos;à {formatTime(current.end)}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-caption uppercase text-muted-foreground">
            Prochain
          </p>
          <p className="mt-0.5 truncate text-body font-semibold text-foreground">
            {isToday ? (next?.event.title ?? "Rien de prévu") : "—"}
          </p>
          {isToday && next && (
            <p className="flex items-center gap-1 text-caption text-muted-foreground">
              <ClockIcon className="h-3 w-3" />
              {formatTime(next.start)} · dans{" "}
              {minutesUntilNext < 60
                ? `${minutesUntilNext} min`
                : formatMinutes(minutesUntilNext)}
            </p>
          )}
        </div>
      </div>

      {conflictsCount > 0 && (
        <p className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-caption text-foreground">
          <AlertTriangleIcon className="h-4 w-4 shrink-0 text-warning" />
          {conflictsCount} créneau{conflictsCount > 1 ? "x" : ""} en conflit
          d&apos;horaire sur cette journée.
        </p>
      )}

      {/* Journée entière */}
      {allDay.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <p className="border-b border-border px-4 py-2 text-caption font-semibold uppercase text-muted-foreground">
            Journée entière
          </p>
          <ul className="divide-y divide-border">
            {allDay.map((occurrence) => (
              <ScheduleEventRow
                key={occurrence.key}
                occurrence={occurrence}
                category={
                  occurrence.event.categoryId !== null
                    ? categoriesById.get(occurrence.event.categoryId)
                    : undefined
                }
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Déroulé de la journée */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="text-subheading font-semibold text-foreground">
            Déroulé de la journée
          </p>
          <button
            type="button"
            onClick={() => onCreate(date)}
            className="rounded-lg px-3 py-1.5 text-caption font-medium text-primary transition-colors hover:bg-primary-soft focus:ring-4 focus:ring-primary/20 focus:outline-none"
          >
            + Ajouter
          </button>
        </div>

        {timed.length === 0 ? (
          <p className="px-4 py-6 text-body text-muted-opacity">
            Aucun créneau minuté — profitez de la journée libre.
          </p>
        ) : (
          <ul>
            {timed.map((occurrence, index) => (
              <li key={occurrence.key}>
                {nowPosition === index && (
                  <div className={`${NOW_LABEL} px-4`} aria-hidden="true">
                    <span className="h-px flex-1 bg-danger/60" />
                    <span>Maintenant {formatTime(now)}</span>
                    <span className="h-px flex-1 bg-danger/60" />
                  </div>
                )}
                <ul className="divide-y divide-border">
                  <ScheduleEventRow
                    occurrence={occurrence}
                    category={
                      occurrence.event.categoryId !== null
                        ? categoriesById.get(occurrence.event.categoryId)
                        : undefined
                    }
                    conflict={conflicts.has(occurrence.key)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </ul>
              </li>
            ))}

            {nowPosition === timed.length && (
              <li className={`${NOW_LABEL} px-4`} aria-hidden="true">
                <span className="h-px flex-1 bg-danger/60" />
                <span>Maintenant {formatTime(now)}</span>
                <span className="h-px flex-1 bg-danger/60" />
              </li>
            )}
          </ul>
        )}
      </div>

      {occurrences.length === 0 && (
        <p className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-caption text-muted-opacity">
          <SearchIcon className="h-4 w-4" />
          Rien à afficher pour cette date avec les filtres actifs.
        </p>
      )}
    </div>
  );
}
