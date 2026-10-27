"use client";

import { useMemo, useState } from "react";
import { db, type Category } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { PlusIcon } from "@/components/icons";
import CollapsibleForm from "@/components/CollapsibleForm";
import TaskFields from "@/components/TaskFields";
import { emptyTaskDraft, taskPayload, type TaskDraft } from "@/lib/taskDraft";
import { useOpenFormSignal } from "@/lib/openForm";
import { toastError, toastSuccess } from "@/lib/toast";

export default function TaskForm() {
  const [draft, setDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ouverture automatique lorsqu'il fait suite à un clic sur « + » (PWA).
  const signal = useOpenFormSignal("task");

  const { data: rawCategories } = useLiveQuery<Category[]>(
    () => db.categories.toArray(),
    []
  );

  const categories = useMemo(() => {
    const list = rawCategories ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [rawCategories]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();

    const payload = taskPayload(draft);
    if (!payload.title) return;

    setSaving(true);
    setError(null);

    try {
      const now = new Date();
      await db.tasks.add({
        ...payload,
        completed: false,
        completedDates: [],
        createdAt: now,
        updatedAt: now,
      });
      setDraft(emptyTaskDraft());
      toastSuccess("Tâche ajoutée", payload.title);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter la tâche.");
      toastError("Impossible d'ajouter la tâche");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CollapsibleForm
      key={signal}
      defaultOpen={signal > 0}
      title="Nouvelle tâche"
      subtitle="Ajoutez une action à suivre"
      icon={<PlusIcon className="h-4.5 w-4.5" />}
    >
      <form onSubmit={addTask}>
        <TaskFields
          draft={draft}
          onChange={setDraft}
          categories={categories}
          idPrefix="task-form"
          error={error}
        />

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving || !draft.title.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            Ajouter la tâche
          </button>
        </div>
      </form>
    </CollapsibleForm>
  );
}
