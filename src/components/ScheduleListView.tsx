"use client";

import type { Category } from "@/lib/db";
import type { Occurrence } from "@/lib/schedule";
import ScheduleDaySection from "@/components/ScheduleDaySection";
import { EmptyCalendarIllustration } from "@/components/illustrations";
import EmptyState from "@/components/EmptyState";
import { dayKey } from "@/lib/dates";

interface Props {
  occurrences: Occurrence[];
  categoriesById: Map<number, Category>;
  conflicts: Set<string>;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => Promise<void>;
  onCreate: (date: Date) => void;
  hasAnyEvent: boolean;
}

/** Vue « liste » : tous les créneaux, regroupés par jour (agenda). */
export default function ScheduleListView({
  occurrences,
  categoriesById,
  conflicts,
  onEdit,
  onDelete,
  onCreate,
  hasAnyEvent,
}: Props) {
  const todayKey = dayKey(new Date());

  const groups = new Map<string, Occurrence[]>();
  for (const occurrence of occurrences) {
    const bucket = groups.get(occurrence.dayKey);
    if (bucket) bucket.push(occurrence);
    else groups.set(occurrence.dayKey, [occurrence]);
  }
  const days = [...groups.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));

  if (days.length === 0) {
    return (
      <EmptyState
        illustration={<EmptyCalendarIllustration />}
        title={
          hasAnyEvent
            ? "Aucun créneau ne correspond aux filtres"
            : "Aucun événement pour le moment"
        }
        description={
          hasAnyEvent
            ? "Élargissez la recherche ou réinitialisez les filtres."
            : "Ajoutez votre premier créneau avec le formulaire ci-dessus."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {days.map(([key, dayOccurrences]) => (
        <ScheduleDaySection
          key={key}
          date={new Date(key)}
          occurrences={dayOccurrences}
          categoriesById={categoriesById}
          conflicts={conflicts}
          isToday={key === todayKey}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreate={onCreate}
          compact
        />
      ))}
    </div>
  );
}
