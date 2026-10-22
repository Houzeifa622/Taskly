"use client";

import { useMemo, useState } from "react";
import { db, type Category, type ScheduleEvent } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import EmptyState from "@/components/EmptyState";
import ScheduleEventItem from "@/components/ScheduleEventItem";
import { EmptyCalendarIllustration } from "@/components/illustrations";
import { toastWithUndo } from "@/lib/undo";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayKey(date: Date): string {
  return startOfDay(date).toISOString();
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

    const snapshot = { ...event };

    try {
      await db.scheduleEvents.delete(id);
      toastWithUndo({
        title: "Événement supprimé",
        description: snapshot.title,
        onUndo: async () => {
          await db.scheduleEvents.add({
            title: snapshot.title,
            note: snapshot.note,
            startDateTime: snapshot.startDateTime,
            endDateTime: snapshot.endDateTime,
            categoryId: snapshot.categoryId,
            recurrence: snapshot.recurrence,
            createdAt: snapshot.createdAt,
          });
        },
      });
    } catch (e) {
      console.error("Erreur lors de la suppression", e);
    }
  }

  function renderEvent(event: ScheduleEvent, index: number) {
    const category =
      event.categoryId !== null
        ? categoriesById.get(event.categoryId)
        : undefined;

    return (
      <ScheduleEventItem
        key={event.id}
        event={event}
        category={category}
        index={index}
        onDelete={deleteEvent}
      />
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-subheading font-semibold text-foreground">
          Mes créneaux
          {events.length > 0 && (
            <span className="ml-2 text-body font-normal tabular-nums text-muted-foreground">
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
              className={`rounded-lg px-3 py-1.5 text-body font-medium transition-colors ${
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
        <EmptyState
          illustration={<EmptyCalendarIllustration />}
          title="Aucun événement pour le moment"
          description="Ajoutez votre premier créneau avec le formulaire ci-dessus."
        />
      ) : view === "agenda" ? (
        <div className="space-y-6">
          {groupedByDay.map(([key, dayEvents]) => {
            const date = new Date(key);
            const isToday = dayKey(new Date()) === key;

            return (
              <div key={key}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h3
                    className={`text-body font-semibold capitalize ${
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
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-caption font-medium text-primary">
                      Aujourd&apos;hui
                    </span>
                  )}
                </div>
                <ul className="space-y-2">
                  {dayEvents.map((event, index) =>
                    renderEvent(event, index)
                  )}
                </ul>
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
                    className={`text-caption font-semibold tracking-wide uppercase ${
                      isToday ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {day.label}
                  </span>
                  <span className="text-caption tabular-nums text-muted-opacity">
                    {day.date.getDate()}
                  </span>
                </div>
                {day.events.length === 0 ? (
                  <p className="py-4 text-center text-caption text-muted-opacity">
                    —
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {day.events.map((event) => (
                      <li
                        key={event.id}
                        className="rounded-lg bg-muted px-2 py-1.5 text-caption leading-tight"
                      >
                        <span className="block font-medium tabular-nums text-foreground">
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
