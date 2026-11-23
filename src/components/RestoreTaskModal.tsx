"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { ArchiveRestoreIcon } from "@/components/icons";
import { dayInputValue, parseDayInput } from "@/lib/tasks";
import type { Task } from "@/lib/db";

interface Props {
  task: Task | null;
  onClose: () => void;
  onRestore: (dueDate: Date, dueTime: string | null) => Promise<void>;
}

const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-body text-foreground transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

/**
 * Restauration d'une tâche archivée : l'utilisateur choisit une nouvelle
 * échéance avant de remettre la tâche dans la liste active.
 */
export default function RestoreTaskModal({ task, onClose, onRestore }: Props) {
  const [date, setDate] = useState(() => dayInputValue(new Date()));
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!task) return;

    const dueDate = parseDayInput(date);
    if (!dueDate) {
      setError("Choisissez une date valide.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onRestore(dueDate, time.trim() || null);
      setDate(dayInputValue(new Date()));
      setTime("");
    } catch (err) {
      console.error(err);
      setError("Impossible de restaurer la tâche.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={task !== null}
      onClose={onClose}
      title="Restaurer la tâche"
      description="Choisissez une nouvelle échéance pour remettre cette tâche dans la liste active."
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-body font-medium text-foreground transition-colors hover:bg-muted focus:ring-4 focus:ring-primary/20 focus:outline-none"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="restore-task-form"
            disabled={saving || !date}
            className="inline-flex items-center gap-1.5 rounded-xl bg-danger px-4 py-2 text-body font-medium text-white transition-colors hover:opacity-90 focus:ring-4 focus:ring-danger/20 focus:outline-none disabled:opacity-50"
          >
            <ArchiveRestoreIcon className="h-4 w-4" />
            Restaurer
          </button>
        </div>
      }
    >
      <form id="restore-task-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
          <p className="text-label font-medium text-foreground">{task.title}</p>
          {task.dueDate && (
            <p className="mt-0.5 text-caption text-muted-foreground">
              Ancienne échéance : {dayInputValue(task.dueDate)}
              {task.dueTime ? ` · ${task.dueTime}` : ""}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-body text-danger">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="restore-due-date"
              className="mb-1.5 block text-label font-medium text-foreground"
            >
              Nouvelle date
            </label>
            <input
              id="restore-due-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={FIELD_CLASS}
              required
            />
          </div>
          <div>
            <label
              htmlFor="restore-due-time"
              className="mb-1.5 block text-label font-medium text-foreground"
            >
              Heure (facultatif)
            </label>
            <input
              id="restore-due-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className={FIELD_CLASS}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
