"use client";

import { useEffect, useState, useMemo } from "react";
import { db, type Category, type ScheduleEvent } from "@/lib/db";

type FilterStatus = "all" | "active" | "completed";

export default function ScheduleList() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await db.scheduleEvents.toArray();
        all.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
        setEvents(all);
      } catch (e) {
        setError("Impossible de charger les événements.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="min-h-[200px] flex items-center justify-center text-muted-opacity">Chargement…</div>;
  }

  return (
    <section className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h1 className="font-semibold text-2xl mb-2">Emploi du temps</h1>
          <p className="text-sm text-muted-foreground">Vos événements et créneaux horaires</p>

          {error && (
            <div className="mt-3 p-3 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          {events.length === 0 ? (
            <div className="pt-8 text-center text-muted-foreground">
              Aucun événement pour le moment.
              <br />
              Ajoutez votre premier événement ci-dessus.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const start = new Date(event.startDateTime);
                const end = new Date(event.endDateTime);
                const startStr = start.toLocaleString("fr-FR", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const endStr = end.toLocaleString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const durationMinutes = Math.ceil(
                  (event.endDateTime.getTime() - event.startDateTime.getTime()) / (1000 * 60)
                );
                const durationStr =
                  durationMinutes > 60
                    ? `${Math.floor(durationMinutes / 60)}h ${(durationMinutes % 60)
                        .toString()
                        .padStart(2, "0")}min`
                    : `${durationMinutes}min`;

                return (
                  <div
                    key={event.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors group-hover:border-primary/20"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-foreground">{event.title}</h3>
                      {event.recurrence !== "none" && (
                        <span
                          className="text-xs px-2 py-1 rounded bg-primary/10 dark:bg-primary/8 text-primary/80"
                        >
                          ↻ {event.recurrence}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {startStr} - {endStr}
                    </p>

                    {durationStr && (
                      <p className="text-xs text-muted-opacity mt-1">
                        {durationStr}
                      </p>
                    )}

                    {event.note && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {event.note}
                      </p>
                    )}

                    <div className="mt-2 text-xs text-muted-opacity">
                      Créé le {
                        event.createdAt.toLocaleDateString("fr-FR") +
                        " " +
                        event.createdAt.toLocaleTimeString("fr-FR")
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}