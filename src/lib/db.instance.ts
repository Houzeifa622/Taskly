import Dexie, { Table } from "dexie";

export interface Category {
  id?: number;
  name: string;
  color?: string;
  createdAt: Date;
}

export interface WordEntry {
  id?: number;
  term: string;
  categoryId: number;
  definition?: string;
  usage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id?: number;
  title: string;
  note?: string;
  /** Jour d'échéance (minuit local), ou null si aucune date n'est fixée. */
  dueDate: Date | null;
  /** Heure d'échéance « HH:MM », facultative. */
  dueTime?: string | null;
  completed: boolean;
  priority: "low" | "normal" | "high";
  recurrence: "none" | "daily" | "weekly" | "monthly";
  /** Dernier jour où la série se répète (vide = sans fin). */
  recurrenceEnd?: Date | null;
  /** Catégorie du carnet, facultative. */
  categoryId?: number | null;
  /** Jours (clés `dayKey`) où une occurrence récurrente a été cochée. */
  completedDates?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export interface ScheduleEvent {
  id?: number;
  title: string;
  note?: string;
  startDateTime: Date;
  endDateTime: Date;
  /** Créneau sans heure précise, occupant la journée entière. */
  allDay?: boolean;
  categoryId: number | null;
  recurrence: Recurrence | null;
  /** Jours de la semaine pour une récurrence hebdomadaire (0 = lundi … 6 = dimanche). */
  weeklyDays?: number[] | null;
  /** Dernier jour où la série se répète (vide = sans fin). */
  recurrenceEnd?: Date | null;
  /** Jours (clés `dayKey`) dont l'occurrence récurrente a été supprimée. */
  exceptions?: string[];
  createdAt: Date;
}

/** Créneau type réutilisable en un clic. */
export interface ScheduleTemplate {
  id?: number;
  title: string;
  note?: string;
  durationMinutes: number;
  categoryId: number | null;
  recurrence: Recurrence;
  createdAt: Date;
}

class TasklyDB extends Dexie {
  categories!: Table<Category, number>;
  words!: Table<WordEntry, number>;
  tasks!: Table<Task, number>;
  scheduleEvents!: Table<ScheduleEvent, number>;
  scheduleTemplates!: Table<ScheduleTemplate, number>;

  constructor() {
    super("TasklyDB");
    this.version(1).stores({
      categories: "++id, name, createdAt",
      words: "++id, term, categoryId, createdAt, updatedAt",
      tasks: "++id, title, dueDate, completed, createdAt",
      scheduleEvents: "++id, startDateTime, endDateTime, categoryId",
    });
    this.version(2).stores({
      categories: "++id, name, createdAt",
      words: "++id, term, categoryId, createdAt, updatedAt",
      tasks: "++id, title, dueDate, completed, createdAt",
      scheduleEvents: "++id, startDateTime, endDateTime, categoryId",
      scheduleTemplates: "++id, title, createdAt",
    });
    // v4 : récurrence hebdomadaire sur plusieurs jours.
    this.version(4).stores({
      categories: "++id, name, createdAt",
      words: "++id, term, categoryId, createdAt, updatedAt",
      tasks: "++id, title, dueDate, completed, createdAt, categoryId",
      scheduleEvents: "++id, startDateTime, endDateTime, categoryId",
      scheduleTemplates: "++id, title, createdAt",
    });
}



}



export const db = new TasklyDB();
