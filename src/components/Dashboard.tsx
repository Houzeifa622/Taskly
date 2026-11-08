"use client";

import { useMemo } from "react";
import Link from "next/link";
import { db, type Task, type ScheduleEvent, type WordEntry } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { expandEvents } from "@/lib/schedule";
import { startOfDay, addDays, formatTime } from "@/lib/dates";
import { CheckCircleIcon, CalendarIcon, BookIcon, PlusIcon } from "@/components/icons";

export default function Dashboard() {
  const { data: tasks } = useLiveQuery<Task[]>(() => db.tasks.toArray(), []);
  const { data: events } = useLiveQuery<ScheduleEvent[]>(() => db.scheduleEvents.toArray(), []);
  const { data: words } = useLiveQuery<WordEntry[]>(() => db.words.toArray(), []);

  const today = useMemo(() => startOfDay(new Date()), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);

  const todayTasks = useMemo(() => {
    const all = tasks ?? [];
    return all
      .filter((t) => {
        if (t.completed) return false;
        if (!t.dueDate) return false;
        const due = startOfDay(new Date(t.dueDate));
        return due.getTime() === today.getTime();
      })
      .sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));
  }, [tasks, today]);

  const overdueTasks = useMemo(() => {
    const all = tasks ?? [];
    return all.filter((t) => {
      if (t.completed) return false;
      if (!t.dueDate) return false;
      const due = startOfDay(new Date(t.dueDate));
      return due.getTime() < today.getTime();
    }).length;
  }, [tasks, today]);

  const todayEvents = useMemo(() => {
    const allEvents = events ?? [];
    const occurrences = expandEvents(allEvents, today, tomorrow);
    return occurrences.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, today, tomorrow]);

  const wordsToReview = useMemo(() => {
    const all = words ?? [];
    return all.filter((w) => !w.learned).length;
  }, [words]);

  const stats = useMemo(() => {
    const allTasks = tasks ?? [];
    const completed = allTasks.filter((t) => t.completed).length;
    const total = allTasks.length;
    return { completed, total };
  }, [tasks]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-title font-bold tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="mt-2 text-body text-muted-foreground">
          Vue d&apos;ensemble de votre journée
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tâches du jour */}
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-primary" />
              <h2 className="text-subheading font-semibold text-foreground">Tâches du jour</h2>
            </div>
            <Link href="/tasks" className="text-caption font-medium text-primary hover:underline">
              Voir tout
            </Link>
          </header>
          <div className="p-6">
            {overdueTasks > 0 && (
              <div className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-caption text-danger">
                {overdueTasks} tâche{overdueTasks > 1 ? "s" : ""} en retard
              </div>
            )}
            {todayTasks.length === 0 ? (
              <p className="text-body text-muted-foreground">Aucune tâche pour aujourd&apos;hui</p>
            ) : (
              <ul className="space-y-2">
                {todayTasks.slice(0, 5).map((task) => (
                  <li key={task.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                    <div className={`h-2 w-2 rounded-full ${task.priority === "high" ? "bg-danger" : task.priority === "normal" ? "bg-amber-500" : "bg-muted-foreground"}`} />
                    <span className="flex-1 truncate text-body text-foreground">{task.title}</span>
                    {task.priority === "high" && (
                      <span className="text-caption text-danger">Urgent</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/tasks"
              className="mt-4 inline-flex items-center gap-1.5 text-caption font-medium text-primary hover:underline"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Ajouter une tâche
            </Link>
          </div>
        </section>

        {/* Emploi du temps du jour */}
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h2 className="text-subheading font-semibold text-foreground">Emploi du temps</h2>
            </div>
            <Link href="/schedule" className="text-caption font-medium text-primary hover:underline">
              Voir tout
            </Link>
          </header>
          <div className="p-6">
            {todayEvents.length === 0 ? (
              <p className="text-body text-muted-foreground">Aucun créneau aujourd&apos;hui</p>
            ) : (
              <ul className="space-y-2">
                {todayEvents.slice(0, 5).map((occurrence) => (
                  <li key={`${occurrence.event.id}-${occurrence.start.getTime()}`} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <span className="text-caption tabular-nums text-muted-foreground">
                      {occurrence.allDay ? "Journée" : formatTime(occurrence.start)}
                    </span>
                    <span className="flex-1 truncate text-body text-foreground">{occurrence.event.title}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/schedule"
              className="mt-4 inline-flex items-center gap-1.5 text-caption font-medium text-primary hover:underline"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Ajouter un créneau
            </Link>
          </div>
        </section>

        {/* Carnet */}
        <section className="rounded-2xl border border-border bg-card shadow-sm lg:col-span-2">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <BookIcon className="h-5 w-5 text-primary" />
              <h2 className="text-subheading font-semibold text-foreground">Mon carnet</h2>
            </div>
            <Link href="/categories" className="text-caption font-medium text-primary hover:underline">
              Ouvrir le carnet
            </Link>
          </header>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-title font-bold text-foreground">{stats.total}</p>
                <p className="text-caption text-muted-foreground">Tâches totales</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-title font-bold text-foreground">{stats.completed}</p>
                <p className="text-caption text-muted-foreground">Terminées</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-title font-bold text-primary">{wordsToReview}</p>
                <p className="text-caption text-muted-foreground">Mots à réviser</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
