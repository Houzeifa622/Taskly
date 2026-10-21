/**
 * Types partagés de l'application.
 *
 * La source de vérité reste `src/lib/db.ts` (schéma Dexie) : ces
 * ré-exports évitent toute duplication qui pourrait diverger.
 */
export type {
  Category,
  ScheduleEvent,
  Task,
  WordEntry,
} from "@/lib/db";

export type Priority = "low" | "normal" | "high";
export type Recurrence = "none" | "daily" | "weekly" | "monthly";
