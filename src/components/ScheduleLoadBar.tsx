"use client";

import type { Category } from "@/lib/db";
import { formatMinutes } from "@/lib/dates";
import type { Occurrence } from "@/lib/schedule";
import { accentOf } from "@/lib/scheduleDraft";

interface Props {
  days: { key: string; date: Date; minutes: number }[];
  occurrences: Occurrence[];
  categoriesById: Map<number, Category>;
}

/** Charge de la semaine : répartition des heures par jour et par catégorie. */
export default function ScheduleLoadBar({
  days,
  occurrences,
  categoriesById,
}: Props) {
  const max = Math.max(60, ...days.map((day) => day.minutes));
  const total = days.reduce((sum, day) => sum + day.minutes, 0);

  const timed = occurrences.filter((occurrence) => !occurrence.allDay);
  const byCategory = new Map<number | null, { minutes: number; label: string; color: string }>();

  for (const occurrence of timed) {
    const categoryId = occurrence.event.categoryId;
    const category =
      categoryId !== null ? categoriesById.get(categoryId) : undefined;
    const minutes = Math.max(
      0,
      Math.round((occurrence.end.getTime() - occurrence.start.getTime()) / 60000)
    );
    const entry = byCategory.get(categoryId);
    if (entry) entry.minutes += minutes;
    else
      byCategory.set(categoryId, {
        minutes,
        label: category?.name ?? "Sans catégorie",
        color: category ? accentOf(category) : "var(--muted-foreground)",
      });
  }

  const categories = [...byCategory.values()].sort(
    (a, b) => b.minutes - a.minutes
  );

  if (total === 0) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-label font-semibold text-foreground">
          Charge de la semaine
        </p>
        <p className="text-body font-semibold tabular-nums text-primary">
          {formatMinutes(total)}
        </p>
      </div>

      {/* Barres par jour */}
      <ul className="space-y-1.5">
        {days.map((day) => (
          <li key={day.key} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-caption font-medium uppercase text-muted-foreground">
              {day.date.toLocaleDateString("fr-FR", { weekday: "short" })}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${Math.round((day.minutes / max) * 100)}%` }}
              />
            </span>
            <span className="w-14 shrink-0 text-right text-caption tabular-nums text-muted-foreground">
              {day.minutes > 0 ? formatMinutes(day.minutes) : "—"}
            </span>
          </li>
        ))}
      </ul>

      {/* Répartition par catégorie */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
        {categories.map((category) => (
          <li
            key={category.label}
            className="flex items-center gap-1.5 text-caption text-muted-foreground"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.label}
            <span className="tabular-nums font-medium text-foreground">
              {formatMinutes(category.minutes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}