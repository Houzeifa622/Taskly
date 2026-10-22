/** Utilitaires de dates partagés par l'emploi du temps. */

export const WEEKDAY_LABELS = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
];

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function dayKey(date: Date): string {
  return startOfDay(date).toISOString();
}

/** Lundi de la semaine contenant la date fournie (lundi = index 0). */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
}

/** Index du jour dans la semaine (lundi = 0 … dimanche = 6). */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** « 09:00 » */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** « 1 h 30 », « 45 min » ou chaîne vide si la durée est nulle. */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest.toString().padStart(2, "0")}` : `${hours} h`;
}

/** Durée en minutes entre deux instants. */
export function durationInMinutes(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}
