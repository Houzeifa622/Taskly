"use client";

import type { Category, Task } from "@/lib/db";
import { db } from "@/lib/db";
import { useRemoveAnimation } from "@/lib/useRemoveAnimation";
import { toastWithUndo } from "@/lib/undo";
import {
  advanceTask,
  dueLabel,
  isTaskOverdue,
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
} from "@/lib/tasks";
import {
  CalendarIcon,
  CheckCircleIcon,
  FlagIcon,
  PencilIcon,
  RepeatIcon,
  TrashIcon,
} from "@/components/icons";

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-info/10 text-info",
  high: "bg-danger/10 text-danger",
};

const BADGE_CLASS =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium";

/**
 * Plie le texte (accents + casse) en conservant la correspondance avec les
 * indices d'origine, pour surligner une recherche même sans accent.
 */
function fold(text: string): { value: string; map: number[] } {
  let value = "";
  const map: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const folded = text[index]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    for (const char of folded) {
      value += char;
      map.push(index);
    }
  }

  return { value, map };
}

function Highlight({ text, query }: { text: string; query?: string }) {
  const term = query?.trim();
  if (!term) return <>{text}</>;

  const haystack = fold(text);
  const needle = fold(term).value;
  const start = needle ? haystack.value.indexOf(needle) : -1;
  if (start < 0) return <>{text}</>;

  const end = start + needle.length - 1;
  const from = haystack.map[start];
  const to = haystack.map[end] + 1;

  return (
    <>
      {text.slice(0, from)}
      <mark className="rounded bg-warning/30 px-0.5 text-inherit">
        {text.slice(from, to)}
      </mark>
      {text.slice(to)}
    </>
  );
}

interface Props {
  task: Task;
  category?: Category;
  query?: string;
  index?: number;
  now: Date;
  onEdit: (task: Task) => void;
}

/**
 * Ligne d'une tâche : case à cocher, badges (priorité, récurrence,
 * catégorie, échéance) et actions.
 *
 * Une tâche récurrente ne disparaît jamais à la coche : l'occurrence est
 * archivée et l'échéance avance à la période suivante.
 */
export default function TaskItem({
  task,
  category,
  query,
  index = 0,
  now,
  onEdit,
}: Props) {
  const { removing, remove } = useRemoveAnimation();

  const id = task.id;
  const due = dueLabel(task, now);
  const overdue = isTaskOverdue(task, now);
  const recurring = task.recurrence !== "none";
  const completionCount = task.completedDates?.length ?? 0;

  async function toggleCompleted() {
    if (id === undefined) return;

    try {
      if (task.completed) {
        await db.tasks.update(id, { completed: false, updatedAt: new Date() });
        return;
      }

      if (!recurring) {
        await db.tasks.update(id, { completed: true, updatedAt: new Date() });
        return;
      }

      const { update, finished, next } = advanceTask(task, new Date());
      await db.tasks.update(id, update);

      toastWithUndo({
        title: finished ? "Série terminée" : "Occurrence cochée",
        description:
          finished || !next
            ? task.title
            : `${task.title} · prochaine le ${next.toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}`,
        onUndo: async () => {
          await db.tasks.update(id, {
            completed: task.completed,
            dueDate: task.dueDate,
            completedDates: task.completedDates,
            updatedAt: new Date(),
          });
        },
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour", err);
    }
  }

  async function deleteTask() {
    if (id === undefined) return;

    const snapshot = { ...task };

    await remove(async () => {
      try {
        await db.tasks.delete(id);
        toastWithUndo({
          title: "Tâche supprimée",
          description: snapshot.title,
          onUndo: async () => {
            const { id: _ignored, ...rest } = snapshot;
            await db.tasks.add(rest);
          },
        });
      } catch (err) {
        console.error("Erreur lors de la suppression", err);
      }
    });
  }

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
      className={`group animate-fade-up flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all duration-200 hover:border-primary/30 ${
        task.completed ? "opacity-60" : ""
      } ${removing ? "scale-95 opacity-0" : ""}`}
    >
      <button
        type="button"
        onClick={toggleCompleted}
        role="checkbox"
        aria-checked={task.completed}
        aria-label={
          task.completed
            ? `Marquer « ${task.title} » comme à faire`
            : recurring
              ? `Cocher l'occurrence de « ${task.title} »`
              : `Marquer « ${task.title} » comme faite`
        }
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus:ring-4 focus:ring-primary/20 focus:outline-none ${
          task.completed
            ? "border-success bg-success text-white"
            : "border-input hover:border-primary"
        }`}
      >
        {task.completed && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3 animate-check-pop"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className={`block w-full text-left text-body focus:ring-4 focus:ring-primary/20 focus:outline-none ${
            task.completed
              ? "text-muted-foreground line-through"
              : "font-medium text-foreground"
          }`}
          aria-label={`Modifier « ${task.title} »`}
        >
          <Highlight text={task.title} query={query} />
        </button>

        {task.note && (
          <p className="mt-1 line-clamp-2 text-caption text-muted-foreground">
            <Highlight text={task.note} query={query} />
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={`${BADGE_CLASS} ${PRIORITY_STYLES[task.priority]}`}>
            <FlagIcon className="h-3 w-3" />
            {PRIORITY_LABELS[task.priority]}
          </span>

          {recurring && (
            <span className={`${BADGE_CLASS} bg-muted text-muted-foreground`}>
              <RepeatIcon className="h-3 w-3" />
              {RECURRENCE_LABELS[task.recurrence]}
            </span>
          )}

          {category && (
            <span className={`${BADGE_CLASS} bg-muted text-muted-foreground`}>
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: category.color ?? "var(--primary)" }}
              />
              {category.name}
            </span>
          )}

          {due && (
            <span
              className={`${BADGE_CLASS} tabular-nums ${
                overdue
                  ? "bg-danger/10 text-danger"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <CalendarIcon className="h-3 w-3" />
              {due.text}
            </span>
          )}

          {recurring && completionCount > 0 && (
            <span className={`${BADGE_CLASS} bg-success/10 text-success`}>
              <CheckCircleIcon className="h-3 w-3" />
              {completionCount} fait{completionCount > 1 ? "es" : "e"}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-muted hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none"
          aria-label={`Modifier « ${task.title} »`}
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={deleteTask}
          className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-danger-soft hover:text-danger focus:ring-4 focus:ring-danger/20 focus:outline-none"
          aria-label={`Supprimer « ${task.title} »`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
