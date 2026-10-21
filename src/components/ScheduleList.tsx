"use client";

import { useMemo, useState } from "react";
import { db, type Category, type ScheduleEvent } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import {
  ClockIcon,
  RepeatIcon,
  TrashIcon,
} from "@/components/icons";

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
};

const WEEKDAYS = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
];

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayKey(date: Date): string {
  return startOfDay(date).toISOString();
}

function formatDuration(event: ScheduleEvent): string {
  const minutes = Math.max(
    0,
    Math.round(
      (event.endDateTime.getTime() - event.startDateTime.getTime()) / 60000
    )
  );
  if (minutes === 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest.toString().padStart(2, "0")}` : `${hours} h`;
}

export default function ScheduleList() {
  const [view, setView] = useState<"agenda" | "week">("agenda");

  const { data: rawEvents, loading } = useLiveQuery<ScheduleEvent[]>(
    () => db.scheduleEvents.toArray(),
    []
  );
  const { data: rawCategories } = useLiveQuery<Category[]>(
    () => db.categories.toArray(),
    []
  );

  const events = useMemo(() => {
    const list = rawEvents ?? [];
    return [...list].sort(
      (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()
    );
  }, [rawEvents]);

  const categoriesById = useMemo(() => {
    const map = new Map<number, Category>();
    for (const category of rawCategories ?? []) {
      if (category.id !== undefined) map.set(category.id, category);
    }
    return map;
  }, [rawCategories]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, ScheduleEvent[]>();
    for (const event of events) {
      const key = dayKey(event.startDateTime);
      const bucket = groups.get(key);
      if (bucket) bucket.push(event);
      else groups.set(key, [event]);
    }
    return [...groups.entries()];
  }, [events]);

  const weekDays = useMemo(() => {
    const today = startOfDay(new Date());
    const monday = new Date(today);
    const offset = (today.getDay() + 6) % 7;
    monday.setDate(today.getDate() - offset);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = dayKey(date);
      return {
        key,
        date,
        label: WEEKDAYS[index],
        events: events.filter(
          (event) => dayKey(event.startDateTime) === key
        ),
      };
    });
  }, [events]);

  async function deleteEvent(event: ScheduleEvent) {
    const id = event.id;
    if (id === undefined) return;
    if (!window.confirm(`Supprimer « ${event.title} » ?`)) return;
    try {
      await db.scheduleEvents.delete(id);
    } catch (e) {
      console.error("Erreur lors de la suppression", e);
    }
  }

  function renderEvent(event: ScheduleEvent) {
    const category =
      event.categoryId !== null
        ? categoriesById.get(event.categoryId)
        : undefined;
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);

    return (
      <li
        key={event.id}
        className="group relative rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:border-primary/30"
        style={
          category?.color
            ? { borderLeftColor: category.color, borderLeftWidth: "4px" }
            : undefined
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {event.title}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                {start.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" – "}
                {end.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {formatDuration(event) && <span>· {formatDuration(event)}</span>}
              {event.recurrence && event.recurrence !== "none" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <RepeatIcon className="h-3 w-3" />
                  {RECURRENCE_LABELS[event.recurrence]}
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color ?? "#6366f1" }}
                  />
                  {category.name}
                </span>
              )}
            </p>
            {event.note && (
              <p className="mt-1.5 text-xs text-muted-opacity">{event.note}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => deleteEvent(event)}
            className="shrink-0 rounded-lg p-1.5 text-muted-opacity transition-colors hover:bg-danger-soft hover:text-danger"
            aria-label={`Supprimer ${event.title}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Mes créneaux
          {events.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {events.length}
            </span>
          )}
        </h2>

        <div className="flex gap-1.5 rounded-xl border border-border bg-card p-1">
          {(
            [
              { value: "agenda", label: "Agenda" },
              { value: "week", label: "Semaine" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              aria-pressed={view === option.value}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === option.value
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-card/60"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Aucun événement pour le moment
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez votre premier créneau avec le formulaire ci-dessus.
          </p>
        </div>
      ) : view === "agenda" ? (
        <div className="space-y-6">
          {groupedByDay.map(([key, dayEvents]) => {
            const date = new Date(key);
            const isToday = dayKey(new Date()) === key;

            return (
              <div key={key}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h3
                    className={`text-sm font-semibold ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {date.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  {isToday && (
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                      Aujourd&apos;hui
                    </span>
                  )}
                </div>
                <ul className="space-y-2">{dayEvents.map(renderEvent)}</ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {weekDays.map((day) => {
            const isToday = dayKey(new Date()) === day.key;

            return (
              <div
                key={day.key}
                className={`rounded-xl border border-border bg-card p-3 ${
                  isToday ? "border-primary/50 bg-primary-soft/40" : ""
                }`}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span
                    className={`text-xs font-semibold tracking-wide uppercase ${
                      isToday ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {day.label}
                  </span>
                  <span className="text-xs text-muted-opacity">
                    {day.date.getDate()}
                  </span>
                </div>
                {day.events.length === 0 ? (
                  <p className="py-4 text-center text-[11px] text-muted-opacity">
                    —
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {day.events.map((event) => (
                      <li
                        key={event.id}
                        className="rounded-lg bg-muted px-2 py-1.5 text-[11px] leading-tight"
                      >
                        <span className="block font-medium text-foreground">
                          {new Date(event.startDateTime).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                        <span className="text-muted-foreground">
                          {event.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
