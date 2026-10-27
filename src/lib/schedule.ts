import type { Recurrence, ScheduleEvent } from "@/lib/db";
import { addDays, dayKey, durationInMinutes, startOfDay, startOfWeek, weekdayIndex } from "@/lib/dates";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Garde-fou : une récurrence ne produit jamais plus d'occurrences que ça. */
const MAX_OCCURRENCES = 800;

export type Moment = "morning" | "afternoon" | "evening";

export const MOMENT_LABELS: Record<Moment, string> = {
  morning: "Matin",
  afternoon: "Après-midi",
  evening: "Soir",
};

export const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
};

/**
 * Une occurrence affichée : soit l'événement stocké, soit l'une de ses
 * répétitions calculées à la volée (rien n'est dupliqué en base).
 */
export interface Occurrence {
  /** Clé stable (React + actions). */
  key: string;
  event: ScheduleEvent;
  start: Date;
  end: Date;
  allDay: boolean;
  recurring: boolean;
  /** Clé du jour de l'occurrence (utilisée pour les exceptions). */
  dayKey: string;
}

export function isAllDay(event: ScheduleEvent): boolean {
  return event.allDay === true;
}

export function momentOf(date: Date): Moment {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/** Ajoute des mois en recadrant sur le dernier jour du mois (31 janv. → 28 févr.). */
function addMonthsClamped(date: Date, months: number): Date {
  const copy = new Date(date);
  const day = copy.getDate();
  copy.setDate(1);
  copy.setMonth(copy.getMonth() + months);
  const lastDay = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
  copy.setDate(Math.min(day, lastDay));
  return copy;
}

/**
 * n-ième occurrence d'une série, toujours calculée depuis la date de départ
 * pour éviter la dérive du type « 31 → 28 → 28 ».
 */
function occurrenceAt(base: Date, index: number, recurrence: Recurrence): Date {
  switch (recurrence) {
    case "daily":
      return addDays(base, index);
    case "weekly":
      return addDays(base, index * 7);
    case "monthly":
      return addMonthsClamped(base, index);
    default:
      return new Date(base);
  }
}

function sameTimeOfDay(base: Date, date: Date): Date {
  const copy = new Date(date);
  copy.setHours(base.getHours(), base.getMinutes(), base.getSeconds(), base.getMilliseconds());
  return copy;
}

/** Index d'occurrence le plus proche (sans le dépasser) pour démarrer une boucle. */
function firstIndex(base: Date, from: Date, recurrence: Recurrence): number {
  if (from.getTime() <= base.getTime()) return 0;

  switch (recurrence) {
    case "daily":
      return Math.max(0, Math.floor((from.getTime() - base.getTime()) / DAY_MS) - 1);
    case "weekly":
      return Math.max(
        0,
        Math.floor((from.getTime() - base.getTime()) / (7 * DAY_MS)) - 1
      );
    case "monthly": {
      const months =
        (from.getFullYear() - base.getFullYear()) * 12 +
        (from.getMonth() - base.getMonth());
      return Math.max(0, months - 1);
    }
    default:
      return 0;
  }
}

function makeOccurrence(
  event: ScheduleEvent,
  start: Date,
  duration: number,
  allDay: boolean,
  recurring: boolean,
  index: number
): Occurrence {
  const startDate = new Date(start);
  return {
    key: `${event.id ?? 0}@${startDate.getTime()}#${index}`,
    event,
    start: startDate,
    end: new Date(startDate.getTime() + duration),
    allDay,
    recurring,
    dayKey: dayKey(startDate),
  };
}

/**
 * Déploie les événements (et leurs répétitions) sur la plage demandée.
 * Les journées entières restent à 00:00 et ne dépassent pas leur journée.
 */
export function expandEvents(
  events: ScheduleEvent[],
  from: Date,
  to: Date
): Occurrence[] {
  const fromDay = startOfDay(from);
  const toDay = new Date(to);
  toDay.setHours(23, 59, 59, 999);

  const occurrences: Occurrence[] = [];

  for (const event of events) {
    const base = new Date(event.startDateTime);
    const allDay = isAllDay(event);
    const duration = Math.max(
      0,
      event.endDateTime.getTime() - event.startDateTime.getTime()
    );
    const recurrence: Recurrence = event.recurrence ?? "none";
    const exceptions = new Set(event.exceptions ?? []);
    // Une série peut se terminer avant la fin de la fenêtre affichée.
    const seriesEnd = event.recurrenceEnd
      ? new Date(event.recurrenceEnd)
      : null;
    const limit =
      seriesEnd && seriesEnd.getTime() < toDay.getTime() ? seriesEnd : toDay;

    if (recurrence === "none") {
      if (base >= fromDay && base <= toDay) {
        occurrences.push(
          makeOccurrence(event, base, duration, allDay, false, 0)
        );
      }
      continue;
    }

    if (recurrence === "weekly") {
      const weeklyDays = (event.weeklyDays?.length
        ? event.weeklyDays
        : [weekdayIndex(base)]
      ).filter((d) => d >= 0 && d <= 6);
      if (weeklyDays.length === 0) continue;

      let weekStart = startOfWeek(fromDay);
      const maxWeeks = 400;
      for (let w = 0; w < maxWeeks; w += 1) {
        for (const day of weeklyDays) {
          const dayStart = addDays(weekStart, day);
          const start = sameTimeOfDay(base, dayStart);
          if (start.getTime() > limit.getTime()) continue;
          if (start.getTime() < fromDay.getTime()) continue;
          const key = dayKey(start);
          if (!exceptions.has(key)) {
            occurrences.push(
              makeOccurrence(event, start, duration, allDay, true, w * 10 + day)
            );
          }
        }
        weekStart = addDays(weekStart, 7);
        if (weekStart.getTime() > limit.getTime() + 7 * DAY_MS) break;
      }
      continue;
    }

    let index = firstIndex(base, fromDay, recurrence);
    for (let i = 0; i < MAX_OCCURRENCES; i += 1) {
      const start = occurrenceAt(base, index, recurrence);
      if (start.getTime() > limit.getTime()) break;

      if (start.getTime() >= fromDay.getTime()) {
        const key = dayKey(start);
        if (!exceptions.has(key)) {
          occurrences.push(
            makeOccurrence(event, start, duration, allDay, true, index)
          );
        }
      }
      index += 1;
    }
  }

  return occurrences.sort(sortOccurrences);
}

export function sortOccurrences(a: Occurrence, b: Occurrence): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  return a.start.getTime() - b.start.getTime();
}

/** Regroupe les occurrences par jour, dans l'ordre chronologique. */
export function groupByDay(occurrences: Occurrence[]): Map<string, Occurrence[]> {
  const map = new Map<string, Occurrence[]>();
  for (const occurrence of occurrences) {
    const bucket = map.get(occurrence.dayKey);
    if (bucket) bucket.push(occurrence);
    else map.set(occurrence.dayKey, [occurrence]);
  }
  for (const bucket of map.values()) bucket.sort(sortOccurrences);
  return map;
}

/**
 * Clés des occurrences qui en chevauchent une autre (journée entière exclue).
 * Sert à signaler visuellement les conflits d'horaires.
 */
export function findConflictKeys(occurrences: Occurrence[]): Set<string> {
  const byDay = new Map<string, Occurrence[]>();
  for (const occurrence of occurrences) {
    if (occurrence.allDay) continue;
    if (occurrence.end.getTime() <= occurrence.start.getTime()) continue;
    const bucket = byDay.get(occurrence.dayKey);
    if (bucket) bucket.push(occurrence);
    else byDay.set(occurrence.dayKey, [occurrence]);
  }

  const conflicts = new Set<string>();
  for (const bucket of byDay.values()) {
    const sorted = [...bucket].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );
    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        if (sorted[j].start.getTime() >= sorted[i].end.getTime()) break;
        conflicts.add(sorted[i].key);
        conflicts.add(sorted[j].key);
      }
    }
  }
  return conflicts;
}

/**
 * Décale la série pour que l'occurrence déplacée arrive exactement sur
 * `newStart` (glisser-déposer). L'heure de fin suit la durée d'origine.
 */
export function movedSeriesStart(
  event: ScheduleEvent,
  newStart: Date
): Pick<ScheduleEvent, "startDateTime" | "endDateTime"> {
  if (isAllDay(event)) {
    const day = startOfDay(newStart);
    const end = new Date(day);
    end.setHours(23, 59, 0, 0);
    return { startDateTime: day, endDateTime: end };
  }

  const next = new Date(event.startDateTime);
  next.setFullYear(newStart.getFullYear(), newStart.getMonth(), newStart.getDate());
  next.setHours(newStart.getHours(), newStart.getMinutes(), 0, 0);

  const duration = Math.max(
    0,
    event.endDateTime.getTime() - event.startDateTime.getTime()
  );
  return {
    startDateTime: next,
    endDateTime: new Date(next.getTime() + duration),
  };
}

/** Copie prête à insérer, décalée d'un certain nombre de jours. */
export function duplicatePayload(
  event: ScheduleEvent,
  dayDelta: number
): Omit<ScheduleEvent, "id"> {
  return {
    title: event.title,
    note: event.note,
    startDateTime: addDays(new Date(event.startDateTime), dayDelta),
    endDateTime: addDays(new Date(event.endDateTime), dayDelta),
    allDay: event.allDay,
    categoryId: event.categoryId,
    recurrence: event.recurrence ?? "none",
    recurrenceEnd: event.recurrenceEnd ?? null,
    exceptions: [],
    createdAt: new Date(),
  };
}

/** Minutes planifiées par jour (journées entières ignorées du cumul horaire). */
export function minutesByDay(occurrences: Occurrence[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const occurrence of occurrences) {
    if (occurrence.allDay) continue;
    const minutes = durationInMinutes(occurrence.start, occurrence.end);
    map.set(occurrence.dayKey, (map.get(occurrence.dayKey) ?? 0) + minutes);
  }
  return map;
}

/** Libellé de période affiché au-dessus de la vue. */
export function periodLabel(
  view: "day" | "week" | "grid" | "month" | "list",
  cursor: Date
): string {
  if (view === "day") {
    return cursor.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (view === "month") {
    return cursor.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }

  if (view === "week" || view === "grid") {
    const start = startOfWeek(cursor);
    const end = addDays(start, 6);
    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      const month = end.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      return `${start.getDate()} – ${end.getDate()} ${month}`;
    }
    return `${start.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    })} – ${end.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }

  return "Tous les créneaux";
}
