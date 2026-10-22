"use client";

import { useState } from "react";
import type { Category } from "@/lib/db";
import type { Occurrence } from "@/lib/schedule";
import { addDays, dayKey, startOfDay, startOfWeek } from "@/lib/dates";
import { accentOf } from "@/lib/scheduleDraft";
import { useNow } from "@/lib/useNow";
import { AlertTriangleIcon } from "@/components/icons";

const START_HOUR = 7;
const END_HOUR = 23;
const HOUR_HEIGHT = 52;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, index) => START_HOUR + index
);

interface Positioned {
  occurrence: Occurrence;
  lane: number;
  lanes: number;
}

/**
 * Répartit les occurrences d'un jour en colonnes afin que les créneaux qui
 * se chevauchent restent lisibles côte à côte.
 */
function layout(occurrences: Occurrence[]): Positioned[] {
  const sorted = [...occurrences].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  const groups: Occurrence[][] = [];
  let current: Occurrence[] = [];
  let currentEnd = 0;

  for (const occurrence of sorted) {
    if (current.length === 0 || occurrence.start.getTime() < currentEnd) {
      current.push(occurrence);
      currentEnd = Math.max(currentEnd, occurrence.end.getTime());
    } else {
      groups.push(current);
      current = [occurrence];
      currentEnd = occurrence.end.getTime();
    }
  }
  if (current.length > 0) groups.push(current);

  const positioned: Positioned[] = [];
  for (const group of groups) {
    const laneEnds: number[] = [];
    const assignment = group.map((occurrence) => {
      let lane = laneEnds.findIndex(
        (end) => end <= occurrence.start.getTime()
      );
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(occurrence.end.getTime());
      } else {
        laneEnds[lane] = occurrence.end.getTime();
      }
      return { occurrence, lane, lanes: 0 };
    });
    const lanes = Math.max(1, laneEnds.length);
    for (const item of assignment) positioned.push({ ...item, lanes });
  }

  return positioned;
}

function offsetFor(date: Date): number {
  const base = date.getHours() * 60 + date.getMinutes();
  return ((base - START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

interface Props {
  cursor: Date;
  occurrences: Occurrence[];
  categoriesById: Map<number, Category>;
  conflicts: Set<string>;
  onEdit: (occurrence: Occurrence) => void;
  onCreate: (date: Date) => void;
  onMoveOccurrence: (
    occurrence: Occurrence,
    target: Date,
    keepTime?: boolean
  ) => void;
}

/**
 * Grille horaire : une colonne par jour, une ligne par heure.
 * Un créneau peut être déposé sur la grille (jour + heure d'arrivée).
 */
export default function ScheduleGridView({
  cursor,
  occurrences,
  categoriesById,
  conflicts,
  onEdit,
  onCreate,
  onMoveOccurrence,
}: Props) {
  const now = useNow();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragging, setDragging] = useState<Occurrence | null>(null);

  const monday = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const todayKey = dayKey(new Date());
  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  const allDayByDay = new Map<string, Occurrence[]>();
  const timedByDay = new Map<string, Occurrence[]>();
  for (const occurrence of occurrences) {
    const target = occurrence.allDay ? allDayByDay : timedByDay;
    const bucket = target.get(occurrence.dayKey);
    if (bucket) bucket.push(occurrence);
    else target.set(occurrence.dayKey, [occurrence]);
  }

  function handleDrop(event: React.DragEvent, date: Date) {
    event.preventDefault();
    setDragOver(null);
    const occurrence = dragging;
    setDragging(null);
    if (!occurrence) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const rawMinutes = (offsetY / HOUR_HEIGHT) * 60 + START_HOUR * 60;
    const snapped = Math.max(0, Math.round(rawMinutes / 30) * 30);

    const target = startOfDay(date);
    target.setMinutes(snapped);
    onMoveOccurrence(occurrence, target, false);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <div className="min-w-[720px]">
        {/* En-têtes de jour */}
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border">
          <div />
          {days.map((date) => {
            const isToday = dayKey(date) === todayKey;
            return (
              <div
                key={date.toISOString()}
                className={`border-l border-border px-2 py-2 text-center ${
                  isToday ? "bg-primary-soft/40" : ""
                }`}
              >
                <p className="text-caption font-semibold uppercase text-muted-foreground">
                  {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                </p>
                <p
                  className={`text-body font-semibold tabular-nums ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bandeau journée entière */}
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border">
          <div className="flex items-center justify-end pr-2 text-caption text-muted-opacity">
            Jour
          </div>
          {days.map((date) => {
            const key = dayKey(date);
            const items = allDayByDay.get(key) ?? [];
            return (
              <div
                key={key}
                className="min-h-9 space-y-1 border-l border-border p-1"
              >
                {items.map((occurrence) => {
                  const category =
                    occurrence.event.categoryId !== null
                      ? categoriesById.get(occurrence.event.categoryId)
                      : undefined;
                  return (
                    <button
                      key={occurrence.key}
                      type="button"
                      onClick={() => onEdit(occurrence)}
                      className="block w-full truncate rounded-md px-1.5 py-0.5 text-left text-caption font-medium text-white focus:ring-4 focus:ring-primary/20 focus:outline-none"
                      style={{ backgroundColor: accentOf(category) }}
                      title={occurrence.event.title}
                    >
                      {occurrence.event.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Grille horaire */}
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          {/* Axe des heures */}
          <div className="relative" style={{ height: gridHeight }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-caption tabular-nums text-muted-opacity"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
              >
                {hour.toString().padStart(2, "0")}h
              </div>
            ))}
          </div>

          {days.map((date) => {
            const key = dayKey(date);
            const isToday = key === todayKey;
            const items = layout(timedByDay.get(key) ?? []);

            return (
              <div
                key={key}
                onDragOver={(event) => {
                  if (!dragging) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOver(key);
                }}
                onDragLeave={() =>
                  setDragOver((value) => (value === key ? null : value))
                }
                onDrop={(event) => handleDrop(event, date)}
                className={`relative border-l border-border ${
                  dragOver === key ? "bg-primary-soft/40" : ""
                }`}
                style={{ height: gridHeight }}
                onDoubleClick={() => onCreate(date)}
              >
                {/* Lignes horaires */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-border/60"
                    style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Ligne « maintenant » */}
                {isToday && (
                  <div
                    aria-hidden
                    className="absolute inset-x-0 z-20 border-t-2 border-danger"
                    style={{ top: offsetFor(now) }}
                  >
                    <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-danger" />
                  </div>
                )}

                {/* Créneaux */}
                {items.map(({ occurrence, lane, lanes }) => {
                  const category =
                    occurrence.event.categoryId !== null
                      ? categoriesById.get(occurrence.event.categoryId)
                      : undefined;
                  const top = offsetFor(occurrence.start);
                  const height = Math.max(
                    22,
                    ((occurrence.end.getTime() - occurrence.start.getTime()) /
                      3_600_000) *
                      HOUR_HEIGHT
                  );
                  const width = 100 / lanes;
                  const conflict = conflicts.has(occurrence.key);

                  return (
                    <button
                      key={occurrence.key}
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", occurrence.key);
                        setDragging(occurrence);
                      }}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => onEdit(occurrence)}
                      title={`${occurrence.event.title} · ${occurrence.start.toLocaleTimeString(
                        "fr-FR",
                        { hour: "2-digit", minute: "2-digit" }
                      )}`}
                      className={`absolute z-10 overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left shadow-sm transition-opacity focus:ring-4 focus:ring-primary/20 focus:outline-none ${
                        dragging?.key === occurrence.key ? "opacity-40" : ""
                      } ${conflict ? "ring-2 ring-warning/70" : ""}`}
                      style={{
                        top,
                        height,
                        left: `calc(${lane * width}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                        backgroundColor: `color-mix(in srgb, var(--card) 92%, ${accentOf(
                          category
                        )})`,
                        borderLeftColor: accentOf(category),
                      }}
                    >
                      <span className="flex items-center gap-1 text-caption font-semibold leading-tight text-foreground">
                        {conflict && (
                          <AlertTriangleIcon className="h-3 w-3 shrink-0 text-warning" />
                        )}
                        <span className="truncate">{occurrence.event.title}</span>
                      </span>
                      {height > 34 && (
                        <span className="block truncate text-caption tabular-nums text-muted-foreground">
                          {occurrence.start.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
