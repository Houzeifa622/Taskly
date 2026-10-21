"use client";

import { useState } from "react";
import { db, type Task } from "@/lib/db";

interface Props {
  task: Task;
  onUpdate: () => void;
}

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  low: "text-gray-500 dark:text-gray-400",
  normal: "text-blue-600 dark:text-blue-400",
  high: "text-red-600 dark:text-red-400",
};

const RECURRENCE_LABELS: Record<Task["recurrence"], string> = {
  none: "",
  daily: "Quotidien",
  weekly: "Hebdo",
  monthly: "Mensuel",
};

export default function TaskItem({ task, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  async function toggleCompleted() {
    try {
      await db.tasks.update(task.id!, {
        completed: !task.completed,
        updatedAt: new Date(),
      });
      onUpdate();
    } catch (e) {
      console.error("Erreur lors de la mise à jour", e);
    }
  }

  async function deleteTask() {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    try {
      await db.tasks.delete(task.id!);
      onUpdate();
    } catch (e) {
      console.error("Erreur lors de la suppression", e);
    }
  }

  async function saveEdit() {
    if (!editTitle.trim()) return;
    try {
      await db.tasks.update(task.id!, {
        title: editTitle.trim(),
        updatedAt: new Date(),
      });
      setIsEditing(false);
      onUpdate();
    } catch (e) {
      console.error("Erreur lors de la modification", e);
    }
  }

  const dueDateStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-800 ${
        task.completed
          ? "bg-gray-50 dark:bg-gray-900/50 opacity-70"
          : "bg-white dark:bg-gray-800"
      }`}
    >
      <button
        onClick={toggleCompleted}
        className="w-5 h-5 rounded-full border-2 shrink-0 transition-all duration-200 focus:outline-none focus:ring-2"
        aria-label="Marquer comme fait"
        style={{
          borderColor: task.completed ? "#10b981" : "#cbd5e1",
          backgroundColor: task.completed ? "#10b981" : "transparent",
        }}
      >
        {task.completed && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            className="w-full text-sm text-foreground bg-transparent border-b border-gray-400 dark:border-gray-500 focus:outline-none focus:border-blue-500"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${task.completed ? "line-through text-gray-400 dark:text-gray-500" : "font-medium text-gray-800 dark:text-gray-200"}`}
              onDoubleClick={() => setIsEditing(true)}
              title="Double-clic pour modifier"
            >
              {task.title}
            </span>
            {task.note && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                — {task.note}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs">
          {dueDateStr && (
            <span className="text-gray-500 dark:text-gray-400">
              📅 {dueDateStr}
            </span>
          )}
          {task.recurrence !== "none" && (
            <span
              className={`px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300`}
            >
              ↻ {RECURRENCE_LABELS[task.recurrence]}
            </span>
          )}
          <span className={`text-gray-500 dark:text-gray-400 ${PRIORITY_COLORS[task.priority]}`}>
            ● {task.priority === "high" ? "Priorité" : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-2">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Modifier"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={deleteTask}
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Supprimer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
