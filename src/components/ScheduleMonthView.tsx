"use client";

import { useState } from "react";
import type { Category } from "@/lib/db";
import { groupByDay, type Occurrence } from "@/lib/schedule";
import { accentOf } from "@/lib/scheduleDraft";
import {
  addDays,
  dayKey,
  startOfWeek,
  weekdayIndex,
  WEEKDAY_LABELS,
} from "@/lib/dates";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

/** Grille de 6 semaines (42 jours) couvrant le mois du curseur. */
function monthGrid(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

interface Props {
  cursor: Date;
  occurrences: Occurrence[];
  categoriesById: Map<number, Category>;
  onEdit: (occurrence: Occurrence) => void;
  onCreate: (date: Date) => void;
  onSelectDay: (date: Date) => void;
  onShiftMonth: (delta: number) => void;
}

/** Vue « mois » : une case par jour, les créneaux condensés en pastilles. */
export default function ScheduleMonthView({
  cursor,
  occurrences,
  categoriesById,
  onEdit,
  onCreate,
  onSelectDay,
  onShiftMonth,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const grid = monthGrid(cursor);
  const byDay = groupByDay(occurrences);
  const todayKey = dayKey(new Date());
  const month = cursor.getMonth();
  const mobileStart = startOfWeek(cursor);

  function cell(date: Date, compact: boolean) {
    const key = dayKey(date);
    const items = byDay.get(key) ?? [];
    const outside = date.getMonth() !== month;
    const isToday = key === todayKey;
    const isExpanded = expanded === key;
    const visible = isExpanded ? items : items.slice(0, 3);

    return (
      <div
        key={key}
        onDoubleClick={() => onCreate(date)}
        className={`flex min-h-[74px] flex-col gap-1 border-l border-t border-border p-1.5 ${
          outside ? "bg-muted/30" : ""
        } ${isToday ? "bg-primary-soft/40" : ""}`}
      >
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => onSelectDay(date)}
            aria-label={`Voir le ${date.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}`}
            className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-caption font-semibold tabular-nums transition-colors focus:ring-4 focus:ring-primary/20 focus:outline-none ${
              isToday
                ? "bg-primary text-primary-foreground"
                : outside
                  ? "text-muted-opacity hover:bg-muted"
                  : "text-foreground hover:bg-muted"
            }`}
          >
            {date.getDate()}
          </button>
          {compact && date.getDate() === 1 && (
            <span className="text-caption capitalize text-muted-opacity">
              {date.toLocaleDateString("fr-FR", { month: "short" })}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-0.5">
          {visible.map((occurrence) => {
            const category =
              occurrence.event.categoryId !== null
                ? categoriesById.get(occurrence.event.categoryId)
                : undefined;
            return (
              <button
                key={occurrence.key}
                type="button"
                onClick={() => onEdit(occurrence)}
                title={occurrence.event.title}
                className={`flex w-full items-center gap-1 truncate rounded-md border-l-2 px-1.5 py-0.5 text-left text-caption font-medium transition-colors hover:bg-muted focus:ring-4 focus:ring-primary/20 focus:outline-none ${
                  outside ? "text-muted-opacity" : "text-foreground"
                }`}
                style={{ borderLeftColor: accentOf(category) }}
              >
                {!occurrence.allDay && (
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {occurrence.start
                      .toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      .replace(":", "h")}
                  </span>
                )}
                <span className="truncate">{occurrence.event.title}</span>
              </button>
            );
          })}

          {items.length > 3 && (
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : key)}
              aria-expanded={isExpanded}
              className="rounded-md px-1.5 py-0.5 text-left text-caption font-medium text-primary transition-colors hover:bg-primary-soft focus:ring-4 focus:ring-primary/20 focus:outline-none"
            >
              {isExpanded ? "Réduire" : `+${items.length - 3} autre${items.length - 3 > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* En-têtes */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onShiftMonth(-1)}
            aria-label="Mois précédent"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:ring-4 focus:ring-primary/20 focus:outline-none"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onShiftMonth(1)}
            aria-label="Mois suivant"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:ring-4 focus:ring-primary/20 focus:outline-none"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="flex-1 text-center text-body font-semibold capitalize text-foreground">
          {cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </p>
        <p className="hidden text-caption text-muted-opacity sm:block">
          Double-clic&nbsp;: créer · clic sur le jour&nbsp;: ouvrir
        </p>
      </div>

      {/* Vue large : grille de 6 semaines */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-1.5 text-center text-caption font-semibold uppercase text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6">
          {grid.map((date) => cell(date, true))}
        </div>
      </div>

      {/* Vue mobile : une seule semaine à la fois */}
      <div className="sm:hidden">
        <div className="space-y-2 p-2">
          {Array.from({ length: 7 }, (_, index) => addDays(mobileStart, index)).map(
            (date) => {
              const key = dayKey(date);
              const items = byDay.get(key) ?? [];
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectDay(date)}
                  className={`flex w-full items-start gap-3 rounded-xl border border-border px-3 py-2 text-left transition-colors hover:bg-muted focus:ring-4 focus:ring-primary/20 focus:outline-none ${
                    isToday ? "border-primary/45 bg-primary-soft/30" : "bg-card"
                  }`}
                >
                  <span className="w-14 shrink-0">
                    <span className="block text-caption font-semibold uppercase text-muted-foreground">
                      {WEEKDAY_LABELS[weekdayIndex(date)]}
                    </span>
                    <span
                      className={`block text-body font-semibold tabular-nums ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    {items.length === 0 ? (
                      <span className="block text-caption text-muted-opacity">
                        Rien de planifié
                      </span>
                    ) : (
                      items.slice(0, 3).map((occurrence) => (
                        <span
                          key={occurrence.key}
                          className="block truncate text-caption text-foreground"
                        >
                          {occurrence.allDay
                            ? ""
                            : `${occurrence.start.toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })} · `}
                          {occurrence.event.title}
                        </span>
                      ))
                    )}
                    {items.length > 3 && (
                      <span className="block text-caption text-primary">
                        +{items.length - 3} autre{items.length - 3 > 1 ? "s" : ""}
                      </span>
                    )}
                  </span>
                </button>
              );
            }
          )}
        </div>
        <p className="border-t border-border px-3 py-2 text-center text-caption text-muted-opacity">
          Semaine du{" "}
          {mobileStart.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>
    </div>
  );
}

/** Libellé du mois affiché dans l'en-tête de la vue. */
export function monthLabel(cursor: Date): string {
  return cursor.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}
