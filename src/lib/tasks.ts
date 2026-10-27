import type { Task } from "@/lib/db";
import { addDays, dayKey, startOfDay } from "@/lib/dates";

/**
 * Logique pure du module Tâches : échéances, regroupement par urgence,
 * récurrence et tri. Aucun accès à la base ici, pour rester testable.
 */

export type TaskGroup = "overdue" | "today" | "week" | "later" | "none" | "done";
export type TaskScope = TaskGroup | "all";
export type TaskStatus = "all" | "pending" | "completed";
export type TaskSort = "urgency" | "priority" | "created" | "alpha";

const DAY_MS = 86_400_000;

export const PRIORITY_LABELS: Record<Task["priority"], string> = {
  low: "Faible",
  normal: "Normale",
  high: "Importante",
};

/** Plus la valeur est petite, plus la priorité est haute. */
const PRIORITY_WEIGHT: Record<Task["priority"], number> = {
  high: 0,
  normal: 1,
  low: 2,
};

export const RECURRENCE_LABELS: Record<Task["recurrence"], string> = {
  none: "",
  daily: "Quotidienne",
  weekly: "Hebdomadaire",
  monthly: "Mensuelle",
};

/** Sections de la liste, dans l'ordre d'affichage. */
export const TASK_GROUPS: { key: TaskGroup; label: string }[] = [
  { key: "overdue", label: "En retard" },
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Prochains jours" },
  { key: "later", label: "À venir" },
  { key: "none", label: "Sans échéance" },
  { key: "done", label: "Terminées" },
];

export const TASK_SORTS: { value: TaskSort; label: string }[] = [
  { value: "urgency", label: "Échéance" },
  { value: "priority", label: "Priorité" },
  { value: "created", label: "Création" },
  { value: "alpha", label: "Alphabétique" },
];

/** « 2026-10-24 » (valeur d'un champ date) → minuit local. */
export function parseDayInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date locale → « 2026-10-24 » pour un champ date. */
export function dayInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Échéance complète (jour + heure éventuelle). */
export function dueDateTime(
  task: Pick<Task, "dueDate" | "dueTime">
): Date | null {
  if (!task.dueDate) return null;

  const due = startOfDay(task.dueDate);
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(":").map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      due.setHours(hours, minutes, 0, 0);
    }
  }
  return due;
}

export function isTaskOverdue(task: Task, now: Date): boolean {
  if (task.completed || !task.dueDate) return false;
  const due = dueDateTime(task);
  return due !== null && due.getTime() < now.getTime();
}

/**
 * Regroupement par urgence. Le retard se juge au jour : une tâche due
 * aujourd'hui à 09h00 reste dans « Aujourd'hui » (elle est simplement
 * signalée en rouge), elle ne bascule pas dans « En retard ».
 */
export function taskGroup(task: Task, now: Date): TaskGroup {
  if (task.completed) return "done";
  if (!task.dueDate) return "none";

  const due = startOfDay(task.dueDate).getTime();
  const today = startOfDay(now).getTime();
  const days = Math.round((due - today) / DAY_MS);

  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "week";
  return "later";
}

/** Fait avancer une date d'une période de récurrence (sans dériver). */
function stepDate(date: Date, recurrence: Task["recurrence"]): Date {
  switch (recurrence) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addDays(date, 7);
    case "monthly": {
      // Le 31 janvier + 1 mois = 28/29 février, pas le 3 mars.
      const copy = new Date(date);
      const dayOfMonth = copy.getDate();
      copy.setDate(1);
      copy.setMonth(copy.getMonth() + 1);
      const lastDay = new Date(
        copy.getFullYear(),
        copy.getMonth() + 1,
        0
      ).getDate();
      copy.setDate(Math.min(dayOfMonth, lastDay));
      return copy;
    }
    default:
      return startOfDay(date);
  }
}

/**
 * Prochaine occurrence strictement postérieure à `after`, en conservant le
 * rythme d'origine (une tâche hebdomadaire du lundi reste le lundi, même si
 * elle est cochée en retard).
 */
export function nextOccurrence(
  base: Date,
  recurrence: Task["recurrence"],
  after: Date
): Date {
  if (recurrence === "none") return startOfDay(base);

  const limit = startOfDay(after).getTime();
  let next = stepDate(startOfDay(base), recurrence);
  let guard = 0;

  while (next.getTime() <= limit && guard < 1_000) {
    next = stepDate(next, recurrence);
    guard += 1;
  }
  return next;
}

export interface Advancement {
  update: Partial<Task>;
  finished: boolean;
  next: Date | null;
}

/**
 * Coche une tâche. Une tâche récurrente ne disparaît jamais : l'occurrence
 * est archivée dans `completedDates` et l'échéance avance. La série se
 * termine quand la date de fin est dépassée.
 */
export function advanceTask(task: Task, now: Date): Advancement {
  if (task.recurrence === "none") {
    return {
      update: { completed: true, updatedAt: now },
      finished: true,
      next: null,
    };
  }

  const base = startOfDay(task.dueDate ?? now);
  const next = nextOccurrence(base, task.recurrence, now);
  const end = task.recurrenceEnd ? startOfDay(task.recurrenceEnd) : null;
  const finished = end !== null && next.getTime() > end.getTime();

  return {
    update: {
      completedDates: [...(task.completedDates ?? []), dayKey(now)],
      completed: finished,
      // Série terminée : on garde la dernière échéance connue.
      dueDate: finished ? task.dueDate : next,
      updatedAt: now,
    },
    finished,
    next: finished ? null : next,
  };
}

function dueValue(task: Task): number {
  const due = dueDateTime(task);
  return due ? due.getTime() : Number.POSITIVE_INFINITY;
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const list = [...tasks];

  switch (sort) {
    case "urgency":
      list.sort((a, b) => {
        const left = dueValue(a);
        const right = dueValue(b);
        if (left !== right) return left < right ? -1 : 1;
        if (a.priority !== b.priority) {
          return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      break;
    case "priority":
      list.sort((a, b) => {
        if (a.priority !== b.priority) {
          return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        }
        const left = dueValue(a);
        const right = dueValue(b);
        if (left !== right) return left < right ? -1 : 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      break;
    case "created":
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case "alpha":
      list.sort((a, b) => a.title.localeCompare(b.title, "fr"));
      break;
  }

  return list;
}

/** Comparaison insensible aux accents et à la casse. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function matchesQuery(task: Task, query: string): boolean {
  const term = normalize(query.trim());
  if (!term) return true;

  return (
    normalize(task.title).includes(term) ||
    normalize(task.note ?? "").includes(term)
  );
}

export interface DueLabel {
  text: string;
  /** L'échéance est passée (heure comprise). */
  overdue: boolean;
}

/** « Aujourd'hui 09:00 », « Demain », « sam. 25 oct. » */
export function dueLabel(task: Task, now: Date): DueLabel | null {
  const due = dueDateTime(task);
  if (!due) return null;

  const today = startOfDay(now).getTime();
  const days = Math.round((startOfDay(due).getTime() - today) / DAY_MS);
  const time = task.dueTime ? ` ${task.dueTime}` : "";

  let day: string;
  if (days === 0) day = "Aujourd'hui";
  else if (days === 1) day = "Demain";
  else if (days === -1) day = "Hier";
  else {
    day = due.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  return {
    text: `${day}${time}`,
    overdue: !task.completed && due.getTime() < now.getTime(),
  };
}
