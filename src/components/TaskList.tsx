"use client";

import { useMemo, useState } from "react";
import { db, type Category, type Task } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { useNow } from "@/lib/useNow";
import TaskItem from "@/components/TaskItem";
import TaskModal from "@/components/TaskModal";
import TaskSection from "@/components/TaskSection";
import EmptyState from "@/components/EmptyState";
import { EmptyChecklistIllustration } from "@/components/illustrations";
import { FilterIcon, SearchIcon } from "@/components/icons";
import {
  matchesQuery,
  sortTasks,
  taskGroup,
  TASK_GROUPS,
  TASK_SORTS,
  type TaskGroup,
  type TaskScope,
  type TaskSort,
  type TaskStatus,
} from "@/lib/tasks";

const STATUS_FILTERS: { value: TaskStatus; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "À faire" },
  { value: "completed", label: "Faites" },
];

const SCOPE_FILTERS: { value: TaskScope; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "overdue", label: "En retard" },
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Prochains jours" },
  { value: "none", label: "Sans échéance" },
];

const SECTION_TONES: Record<
  TaskGroup,
  "danger" | "primary" | "info" | "muted" | "success"
> = {
  overdue: "danger",
  today: "primary",
  week: "info",
  later: "muted",
  none: "muted",
  done: "success",
};

const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

const CHIP_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-medium transition-colors focus:ring-4 focus:ring-primary/20 focus:outline-none";

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

export default function TaskList() {
  const [status, setStatus] = useState<TaskStatus>("all");
  const [scope, setScope] = useState<TaskScope>("all");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TaskSort>("urgency");
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const now = useNow();

  const { data: rawTasks, loading } = useLiveQuery<Task[]>(
    () => db.tasks.toArray(),
    []
  );
  const { data: rawCategories } = useLiveQuery<Category[]>(
    () => db.categories.toArray(),
    []
  );

  const tasks = useMemo(() => rawTasks ?? [], [rawTasks]);

  const categories = useMemo(() => {
    const list = rawCategories ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [rawCategories]);

  const categoryById = useMemo(() => {
    const map = new Map<number, Category>();
    for (const category of categories) {
      if (category.id !== undefined) map.set(category.id, category);
    }
    return map;
  }, [categories]);

  /** Compteurs par section, sur l'ensemble des tâches (hors filtres). */
  const groupCounts = useMemo(() => {
    const counts: Record<TaskGroup, number> = {
      overdue: 0,
      today: 0,
      week: 0,
      later: 0,
      none: 0,
      done: 0,
    };
    for (const task of tasks) {
      counts[taskGroup(task, now)] += 1;
    }
    return counts;
  }, [tasks, now]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    return { total, completed, pending: total - completed };
  }, [tasks]);

  const progress = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const visible = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (status === "pending" && task.completed) return false;
      if (status === "completed" && !task.completed) return false;
      if (categoryId !== null && (task.categoryId ?? null) !== categoryId) {
        return false;
      }
      if (!matchesQuery(task, query)) return false;
      if (scope !== "all" && taskGroup(task, now) !== scope) return false;
      return true;
    });

    return sortTasks(filtered, sort);
  }, [tasks, status, categoryId, query, scope, sort, now]);

  const sections = useMemo(
    () =>
      TASK_GROUPS.map((group) => ({
        ...group,
        items: visible.filter((task) => taskGroup(task, now) === group.key),
      })).filter((section) => section.items.length > 0),
    [visible, now]
  );

  const activeFilters =
    (scope !== "all" ? 1 : 0) + (categoryId !== null ? 1 : 0);

  const isFiltered =
    status !== "all" || scope !== "all" || categoryId !== null || query !== "";

  function resetFilters() {
    setStatus("all");
    setScope("all");
    setCategoryId(null);
    setQuery("");
  }

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

      {/* Recherche + tri */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-opacity" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une tâche…"
            aria-label="Rechercher une tâche"
            className={`${FIELD_CLASS} pl-9`}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="task-sort" className="sr-only">
            Trier par
          </label>
          <select
            id="task-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as TaskSort)}
            className={`${FIELD_CLASS} w-auto`}
          >
            {TASK_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                Trier : {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-caption font-medium transition-colors focus:ring-4 focus:ring-primary/20 focus:outline-none ${
              showFilters || activeFilters > 0
                ? "border-primary/40 bg-primary-soft text-primary"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <FilterIcon className="h-3.5 w-3.5" />
            Filtres
            {activeFilters > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-caption font-semibold text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Statut */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((filter) => (
          <Chip
            key={filter.value}
            active={status === filter.value}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </Chip>
        ))}
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="mt-3 space-y-4 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
          <div>
            <p className="mb-2 text-caption font-semibold uppercase text-muted-foreground">
              Quand
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SCOPE_FILTERS.map((option) => {
                const count =
                  option.value === "all"
                    ? tasks.length
                    : groupCounts[option.value];
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setScope(option.value)}
                    aria-pressed={scope === option.value}
                    className={`${CHIP_CLASS} ${
                      scope === option.value
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                    <span className="tabular-nums opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <p className="mb-2 text-caption font-semibold uppercase text-muted-foreground">
                Catégorie
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCategoryId(null)}
                  aria-pressed={categoryId === null}
                  className={`${CHIP_CLASS} ${
                    categoryId === null
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Toutes
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id ?? null)}
                    aria-pressed={categoryId === category.id}
                    className={`${CHIP_CLASS} ${
                      categoryId === category.id
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: category.color ?? "var(--primary)",
                      }}
                    />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isFiltered && !loading && visible.length > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-caption text-muted-foreground">
            {visible.length} tâche{visible.length > 1 ? "s" : ""} affichée
            {visible.length > 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="text-caption font-medium text-primary transition-colors hover:underline focus:ring-4 focus:ring-primary/20 focus:outline-none"
          >
            Tout effacer
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-card/60"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            illustration={<EmptyChecklistIllustration />}
            title={
              isFiltered
                ? "Aucune tâche ne correspond"
                : "Aucune tâche pour le moment"
            }
            description={
              isFiltered
                ? "Modifiez les filtres pour retrouver vos tâches."
                : "Ajoutez une première tâche : elle apparaîtra ici et se synchronisera automatiquement."
            }
            action={
              isFiltered ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-body font-medium text-foreground transition-colors hover:bg-muted focus:ring-4 focus:ring-primary/20 focus:outline-none"
                >
                  Réinitialiser les filtres
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {sections.map((section) => (
            <TaskSection
              key={`${section.key}-${status}-${scope}`}
              title={section.label}
              count={section.items.length}
              tone={SECTION_TONES[section.key]}
              defaultOpen={
                section.key === "done" ? status === "completed" : true
              }
            >
              <ul className="space-y-2">
                {section.items.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    category={
                      task.categoryId != null
                        ? categoryById.get(task.categoryId)
                        : undefined
                    }
                    query={query}
                    index={index}
                    now={now}
                    onEdit={setEditing}
                  />
                ))}
              </ul>
            </TaskSection>
          ))}
        </div>
      )}

      {editing && (
        <TaskModal
          task={editing}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
