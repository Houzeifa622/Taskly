import type { Category, Recurrence, ScheduleEvent } from "@/lib/db";
import type { Occurrence } from "@/lib/schedule";
import { startOfDay } from "@/lib/dates";

export interface ScheduleDraft {
  title: string;
  note: string;
  allDay: boolean;
  /** Valeur d'un champ `date` ou `datetime-local` (heure locale). */
  start: string;
  end: string;
  categoryId: number | null;
  recurrence: Recurrence;
  /** Date de fin de la série (`YYYY-MM-DD`), vide = répétition sans fin. */
  recurrenceEnd: string;
}

export interface Slot {
  start: Date;
  end: Date;
  allDay?: boolean;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Quand le début change et que la fin n'est pas renseignée (ou devient
 * antérieure), la fin se recale automatiquement 1 h plus tard.
 */
export function autoEnd(draft: ScheduleDraft, start: string): ScheduleDraft {
  if (draft.allDay || !start) return { ...draft, start };

  const startDate = new Date(start);
  const endDate = draft.end ? new Date(draft.end) : null;
  const needsEnd =
    !endDate ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate;

  if (!needsEnd) return { ...draft, start };

  return {
    ...draft,
    start,
    end: toDateTimeInput(new Date(startDate.getTime() + 3_600_000)),
  };
}

export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateTimeInput(date: Date): string {
  return `${toDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function emptyDraft(): ScheduleDraft {
  return {
    title: "",
    note: "",
    allDay: false,
    start: "",
    end: "",
    categoryId: null,
    recurrence: "none",
    recurrenceEnd: "",
  };
}

export function draftFromSlot(slot: Slot): ScheduleDraft {
  const allDay = slot.allDay === true;
  return {
    title: "",
    note: "",
    allDay,
    start: allDay ? toDateInput(slot.start) : toDateTimeInput(slot.start),
    end: allDay ? toDateInput(slot.end) : toDateTimeInput(slot.end),
    categoryId: null,
    recurrence: "none",
    recurrenceEnd: "",
  };
}

export function draftFromOccurrence(occurrence: Occurrence): ScheduleDraft {
  return {
    title: occurrence.event.title,
    note: occurrence.event.note ?? "",
    allDay: occurrence.allDay,
    start: occurrence.allDay
      ? toDateInput(occurrence.start)
      : toDateTimeInput(occurrence.start),
    end: occurrence.allDay
      ? toDateInput(occurrence.end)
      : toDateTimeInput(occurrence.end),
    categoryId: occurrence.event.categoryId,
    recurrence: occurrence.event.recurrence ?? "none",
    recurrenceEnd: occurrence.event.recurrenceEnd
      ? toDateInput(new Date(occurrence.event.recurrenceEnd))
      : "",
  };
}

/**
 * Brouillon d'édition : une série récurrente s'édite depuis sa date de départ
 * (la modification porte sur toute la série, pas sur une occurrence isolée).
 */
export function draftForEdit(occurrence: Occurrence): ScheduleDraft {
  const { event } = occurrence;
  if (event.recurrence && event.recurrence !== "none") {
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    return {
      title: event.title,
      note: event.note ?? "",
      allDay: event.allDay === true,
      start: event.allDay ? toDateInput(start) : toDateTimeInput(start),
      end: event.allDay ? toDateInput(end) : toDateTimeInput(end),
      categoryId: event.categoryId,
      recurrence: event.recurrence,
      recurrenceEnd: event.recurrenceEnd
        ? toDateInput(new Date(event.recurrenceEnd))
        : "",
    };
  }
  return draftFromOccurrence(occurrence);
}

export interface DraftResult {
  startDateTime: Date;
  endDateTime: Date;
  error?: string;
}

/** Convertit le brouillon en dates réelles, en corrigeant les incohérences. */
export function resolveDraft(draft: ScheduleDraft): DraftResult {
  if (draft.allDay) {
    const startDay = draft.start ? startOfDay(new Date(`${draft.start}T00:00`)) : null;
    const endDay = draft.end ? startOfDay(new Date(`${draft.end}T00:00`)) : startDay;

    if (!startDay || Number.isNaN(startDay.getTime())) {
      return {
        startDateTime: new Date(),
        endDateTime: new Date(),
        error: "Choisissez une date.",
      };
    }

    const end = endDay && endDay >= startDay ? endDay : startDay;
    end.setHours(23, 59, 0, 0);
    return { startDateTime: startDay, endDateTime: end };
  }

  const start = draft.start ? new Date(draft.start) : new Date();
  if (Number.isNaN(start.getTime())) {
    return {
      startDateTime: new Date(),
      endDateTime: new Date(),
      error: "L'heure de début est invalide.",
    };
  }

  let end = draft.end ? new Date(draft.end) : null;
  if (!end || Number.isNaN(end.getTime()) || end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  return { startDateTime: start, endDateTime: end };
}

/** Applique une durée rapide au brouillon (30 min, 1 h, 1 h 30, 2 h…). */
export function withDuration(draft: ScheduleDraft, minutes: number): ScheduleDraft {
  const start = draft.start ? new Date(draft.start) : null;
  const base =
    start && !Number.isNaN(start.getTime())
      ? start
      : nextHalfHour(new Date());

  return {
    ...draft,
    start: toDateTimeInput(base),
    end: toDateTimeInput(new Date(base.getTime() + minutes * 60_000)),
  };
}

/** Prochaine demi-heure pleine (08:17 → 08:30, 08:40 → 09:00). */
export function nextHalfHour(date: Date): Date {
  const copy = new Date(date);
  copy.setSeconds(0, 0);
  const minutes = copy.getMinutes();
  const rounded = minutes === 0 || minutes === 30 ? minutes : minutes < 30 ? 30 : 60;
  copy.setMinutes(rounded);
  return copy;
}

/** Teinte d'accent d'une catégorie (repli sur la couleur primaire). */
export function accentOf(category?: Category): string {
  return category?.color ?? "var(--primary)";
}

/**
 * Quand un créneau est répété, proposer la date de fin de série évite les
 * répétitions infinies : la récurrence s'arrête à la date choisie.
 */
function resolveRecurrenceEnd(draft: ScheduleDraft): Date | null {
  if (draft.recurrence === "none" || !draft.recurrenceEnd) return null;
  const end = new Date(`${draft.recurrenceEnd}T23:59:59`);
  return Number.isNaN(end.getTime()) ? null : end;
}

export function eventPayload(
  draft: ScheduleDraft,
  resolved: DraftResult
): Omit<ScheduleEvent, "id" | "createdAt"> {
  return {
    title: draft.title.trim(),
    note: draft.note.trim() || undefined,
    startDateTime: resolved.startDateTime,
    endDateTime: resolved.endDateTime,
    allDay: draft.allDay,
    categoryId: draft.categoryId,
    recurrence: draft.recurrence,
    recurrenceEnd: resolveRecurrenceEnd(draft),
  };
}
