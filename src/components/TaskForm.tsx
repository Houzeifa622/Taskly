"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { PlusIcon } from "@/components/icons";
import CollapsibleForm from "@/components/CollapsibleForm";
import { useOpenFormSignal } from "@/lib/openForm";
import { toastError, toastSuccess } from "@/lib/toast";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Faible" },
  { value: "normal", label: "Normale" },
  { value: "high", label: "Importante" },
] as const;

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Aucune" },
  { value: "daily", label: "Quotidienne" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuelle" },
] as const;

const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

const LABEL_CLASS = "mb-1.5 block text-label font-medium text-foreground";

export default function TaskForm() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] =
    useState<(typeof PRIORITY_OPTIONS)[number]["value"]>("normal");
  const [recurrence, setRecurrence] =
    useState<(typeof RECURRENCE_OPTIONS)[number]["value"]>("none");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ouverture automatique lorsqu'il fait suite à un clic sur « + » (PWA).
  const signal = useOpenFormSignal("task");

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const now = new Date();
      await db.tasks.add({
        title: title.trim(),
        note: note.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        completed: false,
        priority,
        recurrence,
        createdAt: now,
        updatedAt: now,
      });
      setTitle("");
      setNote("");
      setDueDate("");
      setPriority("normal");
      setRecurrence("none");
      toastSuccess("Tâche ajoutée", title.trim());
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
        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-body text-danger">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="task-title" className={LABEL_CLASS}>
              Titre
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Récupérer les documents, implémenter la fonction X…"
              className={FIELD_CLASS}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-note" className={LABEL_CLASS}>
                Note
              </label>
              <textarea
                id="task-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Détails ou précision…"
                className={`${FIELD_CLASS} resize-y`}
              />
            </div>

            <div>
              <label htmlFor="task-due" className={LABEL_CLASS}>
                Date prévue
              </label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-priority" className={LABEL_CLASS}>
                Priorité
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as (typeof PRIORITY_OPTIONS)[number]["value"]
                  )
                }
                className={FIELD_CLASS}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-recurrence" className={LABEL_CLASS}>
                Récurrence
              </label>
              <select
                id="task-recurrence"
                value={recurrence}
                onChange={(e) =>
                  setRecurrence(
                    e.target.value as (typeof RECURRENCE_OPTIONS)[number]["value"]
                  )
                }
                className={FIELD_CLASS}
              >
                {RECURRENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving || !title.trim()}
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
