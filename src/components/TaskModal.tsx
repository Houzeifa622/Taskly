"use client";

import { useState } from "react";
import { db, type Category, type Task } from "@/lib/db";
import Modal from "@/components/Modal";
import TaskFields from "@/components/TaskFields";
import { draftFromTask, taskPayload, type TaskDraft } from "@/lib/taskDraft";
import { toastError, toastSuccess } from "@/lib/toast";
import { toastWithUndo } from "@/lib/undo";
import { RECURRENCE_LABELS } from "@/lib/tasks";

interface Props {
  task: Task;
  categories: Category[];
  onClose: () => void;
}

/**
 * Édition complète d'une tâche : tout est modifiable, y compris la
 * récurrence. Une série se modifie dans son ensemble (comme pour les
 * créneaux de l'emploi du temps).
 */
export default function TaskModal({ task, categories, onClose }: Props) {
  const [draft, setDraft] = useState<TaskDraft>(() => draftFromTask(task));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const recurring = task.recurrence !== "none";

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (task.id === undefined) return;

    const payload = taskPayload(draft);
    if (!payload.title) {
      setError("Le titre est obligatoire.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await db.tasks.update(task.id, {
        ...payload,
        updatedAt: new Date(),
      });
      toastSuccess("Tâche mise à jour", payload.title);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Impossible d'enregistrer les modifications.");
      toastError("Impossible de modifier la tâche");
    } finally {
      setSaving(false);
    }
  }

  async function removeTask() {
    if (task.id === undefined) return;

    const snapshot = { ...task };

    try {
      await db.tasks.delete(task.id);
      onClose();
      toastWithUndo({
        title: "Tâche supprimée",
        description: snapshot.title,
        onUndo: async () => {
          const { id: _ignored, ...rest } = snapshot;
          await db.tasks.add(rest);
        },
      });
    } catch (err) {
      console.error(err);
      toastError("Impossible de supprimer la tâche");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Modifier la tâche"
      description="Toutes les informations sont modifiables."
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={removeTask}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-caption font-medium text-danger transition-colors hover:bg-danger-soft focus:ring-4 focus:ring-danger/20 focus:outline-none"
          >
            Supprimer
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-body font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:ring-4 focus:ring-primary/20 focus:outline-none"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="task-edit-form"
              disabled={saving || !draft.title.trim()}
              className="rounded-xl bg-primary px-5 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </div>
      }
    >
      <form id="task-edit-form" onSubmit={save}>
        {recurring && (
          <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-caption text-muted-foreground">
            Série récurrente ({RECURRENCE_LABELS[task.recurrence]}) : la
            modification s&apos;applique à toute la série.
          </p>
        )}

        <TaskFields
          draft={draft}
          onChange={setDraft}
          categories={categories}
          idPrefix="task-edit"
          error={error}
        />
      </form>
    </Modal>
  );
}
