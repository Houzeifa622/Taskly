"use client";

import { useState } from "react";
import { db, type Task } from "@/lib/db";
import {
  CalendarIcon,
  FlagIcon,
  PencilIcon,
  RepeatIcon,
  TrashIcon,
} from "@/components/icons";

interface Props {
  task: Task;
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

export default function TaskItem({ task }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  // Horodatage figé au montage : évite un calcul impur pendant le rendu.
  const [mountedAt] = useState(() => Date.now());

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
    if (!window.confirm(`Supprimer « ${task.title} » ?`)) return;
    try {
      await db.tasks.delete(id);
    } catch (e) {
      console.error("Erreur lors de la suppression", e);
    }
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
      className={`group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/30 ${
        task.completed ? "opacity-60" : ""
      }`}
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
            className="h-3 w-3"
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
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-sm text-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={startEditing}
            title="Double-clic pour modifier"
            className={`block w-full text-left text-sm ${
              task.completed
                ? "text-muted-foreground line-through"
                : "font-medium text-foreground"
            }`}
          >
            {task.title}
          </button>
        )}

        {task.note && !isEditing && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {task.note}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLES[task.priority]}`}
          >
            <FlagIcon className="h-3 w-3" />
            {PRIORITY_LABELS[task.priority]}
          </span>

          {task.recurrence !== "none" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <RepeatIcon className="h-3 w-3" />
              {RECURRENCE_LABELS[task.recurrence]}
            </span>
          )}

          {dueLabel && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                isOverdue
                  ? "bg-danger/10 text-danger"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <CalendarIcon className="h-3 w-3" />
              {dueLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={startEditing}
          className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-muted hover:text-primary"
          aria-label={`Modifier « ${task.title} »`}
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={deleteTask}
          className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-danger-soft hover:text-danger"
          aria-label={`Supprimer « ${task.title} »`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
