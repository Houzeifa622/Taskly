export type Priority = "low" | "normal" | "high";
export type Recurrence = "none" | "daily" | "weekly" | "monthly";

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
  priority: Priority;
  recurrence: Recurrence;
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
  recurrence: Recurrence | null;
}
