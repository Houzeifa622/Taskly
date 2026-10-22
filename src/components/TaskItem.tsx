"use client";

import { useState } from "react";
import { db, type Task } from "@/lib/db";
import { useRemoveAnimation } from "@/lib/useRemoveAnimation";
import { toastWithUndo } from "@/lib/undo";
import {
  CalendarIcon,
  FlagIcon,
  PencilIcon,
  RepeatIcon,
  TrashIcon,
} from "@/components/icons";

interface Props {
  task: Task;
  index?: number;
}

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-info/10 text-info",
  high: "bg-danger/10 text-danger",
};

const PRIORITY_LABELS: Record<Task["priority"], string> = {
  low: "Faible",
  normal: "Normale",
  high: "Importante",
};

const RECURRENCE_LABELS: Record<Task["recurrence"], string> = {
  none: "",
  daily: "Quotidienne",
  weekly: "Hebdomadaire",
  monthly: "Mensuelle",
};

const BADGE_CLASS =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium";

export default function TaskItem({ task, index = 0 }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  // Horodatage figé au montage : évite un calcul impur pendant le rendu.
  const [mountedAt] = useState(() => Date.now());
  const { removing, remove } = useRemoveAnimation();

  const id = task.id;

  function startEditing() {
    setEditTitle(task.title);
    setIsEditing(true);
  }

  async function toggleCompleted() {
    if (id === undefined) return;
    try {
      await db.tasks.update(id, {
        completed: !task.completed,
        updatedAt: new Date(),
      });
    } catch (e) {
      console.error("Erreur lors de la mise à jour", e);
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
            await db.tasks.add({
              title: snapshot.title,
              note: snapshot.note,
              dueDate: snapshot.dueDate,
              completed: snapshot.completed,
              priority: snapshot.priority,
              recurrence: snapshot.recurrence,
              createdAt: snapshot.createdAt,
              updatedAt: snapshot.updatedAt,
            });
          },
        });
      } catch (e) {
        console.error("Erreur lors de la suppression", e);
      }
    });
  }

  async function saveEdit() {
    if (id === undefined) return;
    const title = editTitle.trim();
    if (!title) {
      setEditTitle(task.title);
      setIsEditing(false);
      return;
    }
    try {
      await db.tasks.update(id, { title, updatedAt: new Date() });
      setIsEditing(false);
    } catch (e) {
      console.error("Erreur lors de la modification", e);
    }
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const dueLabel = dueDate
    ? dueDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })
    : null;
  const isOverdue =
    dueDate !== null && !task.completed && dueDate.getTime() < mountedAt;

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
      className={`group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all duration-200 hover:border-primary/30 animate-fade-up ${
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
            : `Marquer « ${task.title} » comme fait`
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
        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") {
                setEditTitle(task.title);
                setIsEditing(false);
              }
            }}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-body text-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={startEditing}
            title="Double-clic pour modifier"
            className={`block w-full text-left text-body ${
              task.completed
                ? "text-muted-foreground line-through"
                : "font-medium text-foreground"
            }`}
          >
            {task.title}
          </button>
        )}

        {task.note && !isEditing && (
          <p className="mt-1 line-clamp-2 text-caption text-muted-foreground">
            {task.note}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={`${BADGE_CLASS} ${PRIORITY_STYLES[task.priority]}`}>
            <FlagIcon className="h-3 w-3" />
            {PRIORITY_LABELS[task.priority]}
          </span>

          {task.recurrence !== "none" && (
            <span
              className={`${BADGE_CLASS} bg-muted text-muted-foreground`}
            >
              <RepeatIcon className="h-3 w-3" />
              {RECURRENCE_LABELS[task.recurrence]}
            </span>
          )}

          {dueLabel && (
            <span
              className={`${BADGE_CLASS} ${
                isOverdue
                  ? "bg-danger/10 text-danger"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <CalendarIcon className="h-3 w-3" />
              <span className="tabular-nums">{dueLabel}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={startEditing}
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
