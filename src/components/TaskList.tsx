"use client";

import { useMemo, useState } from "react";
import { db, type Task } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import TaskItem from "@/components/TaskItem";
import EmptyState from "@/components/EmptyState";
import { EmptyChecklistIllustration } from "@/components/illustrations";

type FilterStatus = "all" | "completed" | "pending";
type DateFilter = "all" | "with-date" | "without-date" | "today";

interface Props {
  initialStatusFilter?: FilterStatus;
  initialDateFilter?: DateFilter;
}

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "À faire" },
  { value: "completed", label: "Faites" },
];

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "with-date", label: "Avec date" },
  { value: "without-date", label: "Sans date" },
  { value: "today", label: "Aujourd'hui" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-body font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-primary-soft text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function TaskList({
  initialStatusFilter = "all",
  initialDateFilter = "all",
}: Props) {
  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>(initialStatusFilter);
  const [dateFilter, setDateFilter] =
    useState<DateFilter>(initialDateFilter);

  const { data: rawTasks, loading } = useLiveQuery<Task[]>(
    () => db.tasks.toArray(),
    []
  );

  const tasks = useMemo(() => {
    const list = rawTasks ?? [];
    return [...list].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [rawTasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (statusFilter === "completed") {
      result = result.filter((t) => t.completed);
    } else if (statusFilter === "pending") {
      result = result.filter((t) => !t.completed);
    }

    if (dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      result = result.filter((t) => {
        if (dateFilter === "with-date") return t.dueDate !== null;
        if (dateFilter === "without-date") return t.dueDate === null;

        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        return due.getTime() === today.getTime();
      });
    }

    return result;
  }, [tasks, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    return { total, completed, pending: total - completed };
  }, [tasks]);

  const progress = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const isFiltered =
    statusFilter !== "all" || dateFilter !== "all";

  return (
    <section className="mt-8">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: stats.total, className: "text-foreground" },
          {
            label: "À faire",
            value: stats.pending,
            className: "text-info",
          },
          {
            label: "Faites",
            value: stats.completed,
            className: "text-success",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
          >
            <p className="text-caption font-medium tracking-wide text-muted-opacity uppercase">
              {stat.label}
            </p>
            <p
              className={`mt-1 text-heading font-semibold tabular-nums ${stat.className}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {stats.total > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              active={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DATE_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              active={dateFilter === filter.value}
              onClick={() => setDateFilter(filter.value)}
            >
              {filter.label}
            </Chip>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-card/60"
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            illustration={<EmptyChecklistIllustration />}
            title={
              isFiltered ? "Aucune tâche ne correspond" : "Aucune tâche pour le moment"
            }
            description={
              isFiltered
                ? "Modifiez les filtres pour retrouver vos tâches."
                : "Ajoutez une première tâche : elle apparaîtra ici et se synchronisera automatiquement."
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filteredTasks.map((task, index) => (
            <TaskItem key={task.id} task={task} index={index} />
          ))}
        </ul>
      )}
    </section>
  );
}
