import type { Task } from "@/lib/db";
import { dayInputValue, parseDayInput } from "@/lib/tasks";

/**
 * Brouillon de formulaire partagé par la création rapide et la modale
 * d'édition : les dates y sont des chaînes (`YYYY-MM-DD` / `HH:MM`) pour
 * rester compatibles avec les champs natifs.
 */
export interface TaskDraft {
  title: string;
  note: string;
  dueDate: string;
  dueTime: string;
  priority: Task["priority"];
  recurrence: Task["recurrence"];
  /** Date de fin de série (`YYYY-MM-DD`), vide = répétition sans fin. */
  recurrenceEnd: string;
  categoryId: number | null;
}

export type TaskPayload = Pick<
  Task,
  | "title"
  | "note"
  | "dueDate"
  | "dueTime"
  | "priority"
  | "recurrence"
  | "recurrenceEnd"
  | "categoryId"
>;

export function emptyTaskDraft(): TaskDraft {
  return {
    title: "",
    note: "",
    dueDate: "",
    dueTime: "",
    priority: "normal",
    recurrence: "none",
    recurrenceEnd: "",
    categoryId: null,
  };
}

export function draftFromTask(task: Task): TaskDraft {
  return {
    title: task.title,
    note: task.note ?? "",
    dueDate: task.dueDate ? dayInputValue(task.dueDate) : "",
    dueTime: task.dueTime ?? "",
    priority: task.priority,
    recurrence: task.recurrence,
    recurrenceEnd: task.recurrenceEnd
      ? dayInputValue(task.recurrenceEnd)
      : "",
    categoryId: task.categoryId ?? null,
  };
}

export function taskPayload(draft: TaskDraft): TaskPayload {
  const dueDate = draft.dueDate ? parseDayInput(draft.dueDate) : null;

  return {
    title: draft.title.trim(),
    note: draft.note.trim() || undefined,
    dueDate,
    dueTime: dueDate && draft.dueTime ? draft.dueTime : null,
    priority: draft.priority,
    recurrence: draft.recurrence,
    recurrenceEnd:
      draft.recurrence !== "none" && draft.recurrenceEnd
        ? parseDayInput(draft.recurrenceEnd)
        : null,
    categoryId: draft.categoryId,
  };
}

/**
 * Fin de répétition proposée par défaut : trois mois après l'échéance
 * (ou aujourd'hui + 3 mois si aucune date n'est fixée).
 */
export function defaultRecurrenceEnd(draft: TaskDraft): string {
  const base =
    parseDayInput(draft.dueDate) ?? parseDayInput(dayInputValue(new Date()));
  const from = base ?? new Date();
  const end = new Date(from.getFullYear(), from.getMonth() + 3, from.getDate());
  return dayInputValue(end);
}
