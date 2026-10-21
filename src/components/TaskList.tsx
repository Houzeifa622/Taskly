"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { db, type Task } from "@/lib/db";
import TaskItem from "@/components/TaskItem";

type FilterStatus = "all" | "completed" | "pending";

interface Props {
  initialStatusFilter?: FilterStatus;
  initialDateFilter?: "all" | "with-date" | "without-date" | "today";
}

export default function TaskList({
  initialStatusFilter = "all",
  initialDateFilter = "all",
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>(initialStatusFilter);
  const [dateFilter, setDateFilter] = useState<"all" | "with-date" | "without-date" | "today">(initialDateFilter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await db.tasks.toArray();
        all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setTasks(all);
      } catch (e) {
        setError("Impossible de charger les tâches.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (statusFilter === "completed") {
      result = result.filter((t) => t.completed);
    } else if (statusFilter === "pending") {
      result = result.filter((t) => !t.completed);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "with-date") {
      result = result.filter((t) => t.dueDate !== null);
    } else if (dateFilter === "without-date") {
      result = result.filter((t) => t.dueDate === null);
    } else if (dateFilter === "today") {
      result = result.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    }

    return result;
  }, [tasks, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  if (loading) {
    return <div className="min-h-[200px] flex items-center justify-center text-muted-opacity">Chargement…</div>;
  }

  return (
    <section className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 rounded-lg border bg-card/50 py-3 text-sm">
            <div className="text-primary/60 text-xs font-medium uppercase tracking-wider">Total</div>
            <div className="font-medium text-foreground">{stats.total}</div>
          </div>
          <div className="flex-1 rounded-lg border bg-card/50 py-3 text-sm">
            <div className="text-green-500 text-xs font-medium uppercase tracking-wider">Fait</div>
            <div className="font-medium text-green-600">{stats.completed}</div>
          </div>
          <div className="flex-1 rounded-lg border bg-card/50 py-3 text-sm">
            <div className="text-blue-500 text-xs font-medium uppercase tracking-wider">À faire</div>
            <div className="font-medium text-blue-600">{stats.pending}</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                statusFilter === "all"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                statusFilter === "pending"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              À faire
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                statusFilter === "completed"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Fait
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter("all")}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                dateFilter === "all"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Toutes dates
            </button>
            <button
              onClick={() => setDateFilter("with-date")}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                dateFilter === "with-date"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Avec date
            </button>
            <button
              onClick={() => setDateFilter("without-date")}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                dateFilter === "without-date"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Sans date
            </button>
            <button
              onClick={() => setDateFilter("today")}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                dateFilter === "today"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Aujourd'hui
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Aucune tâche correspondante.
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} onUpdate={() => {}} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}