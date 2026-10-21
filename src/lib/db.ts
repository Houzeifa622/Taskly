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
  dueDate: Date | null;
  completed: boolean;
  priority: "low" | "normal" | "high";
  recurrence: "none" | "daily" | "weekly" | "monthly";
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleEvent {
  id?: number;
  title: string;
  note?: string;
  startDateTime: Date;
  endDateTime: Date;
  categoryId: number | null;
  recurrence: "none" | "daily" | "weekly" | "monthly" | null;
  createdAt: Date;
}

class TasklyDB extends Dexie {
  categories!: Table<Category, number>;
  words!: Table<WordEntry, number>;
  tasks!: Table<Task, number>;
  scheduleEvents!: Table<ScheduleEvent, number>;

  constructor() {
    super("TasklyDB");
    this.version(1).stores({
      categories: "++id, name, createdAt",
      words: "++id, term, categoryId, createdAt, updatedAt",
      tasks: "++id, title, dueDate, completed, createdAt",
      scheduleEvents: "++id, startDateTime, endDateTime, categoryId",
    });
  }
}

export const db = new TasklyDB();
