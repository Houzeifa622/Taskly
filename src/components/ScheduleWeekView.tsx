"use client";

import { useState } from "react";
import type { Category } from "@/lib/db";
import { groupByDay, type Occurrence } from "@/lib/schedule";
import { addDays, dayKey, startOfDay, startOfWeek } from "@/lib/dates";
import ScheduleDaySection from "@/components/ScheduleDaySection";

interface Props {
  cursor: Date;
  occurrences: Occurrence[];
  categoriesById: Map<number, Category>;
  conflicts: Set<string>;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => Promise<void>;
  onCreate: (date: Date) => void;
  onMoveOccurrence: (occurrence: Occurrence, target: Date) => void;
}

/**
 * Vue « semaine » verticale : sept blocs jour empilés (lundi → dimanche).
 * Les créneaux peuvent être déposés sur un autre jour (glisser-déposer).
 */
export default function ScheduleWeekView({
  cursor,
  occurrences,
  categoriesById,
  conflicts,
  onEdit,
  onDelete,
  onCreate,
  onMoveOccurrence,
}: Props) {
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const todayKey = dayKey(new Date());
  const byDay = groupByDay(occurrences);

  const monday = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(monday, index)
  );

  function handleDrop(key: string, target: Date) {
    const occurrence = occurrences.find((item) => item.key === key);
    setDraggedKey(null);
    if (!occurrence || dayKey(occurrence.start) === dayKey(target)) return;
    onMoveOccurrence(occurrence, startOfDay(target));
  }

  return (
    <div className="space-y-3">
      {days.map((date) => (
        <ScheduleDaySection
          key={date.toISOString()}
          date={date}
          occurrences={byDay.get(dayKey(date)) ?? []}
          categoriesById={categoriesById}
          conflicts={conflicts}
          isToday={dayKey(date) === todayKey}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreate={onCreate}
          onDropOccurrence={handleDrop}
          onDragStart={(occurrence) => setDraggedKey(occurrence.key)}
          onDragEnd={() => setDraggedKey(null)}
          draggedKey={draggedKey}
        />
      ))}

      <p className="pt-1 text-center text-caption text-muted-opacity">
        Astuce : faites glisser un créneau vers un autre jour pour le déplacer.
      </p>
    </div>
  );
}
