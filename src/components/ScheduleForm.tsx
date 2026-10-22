"use client";

import { useState } from "react";
import { db, type Category } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { PlusIcon } from "@/components/icons";
import CollapsibleForm from "@/components/CollapsibleForm";
import { useOpenFormSignal } from "@/lib/openForm";
import { toastError, toastSuccess } from "@/lib/toast";

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Aucune" },
  { value: "daily", label: "Quotidienne" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuelle" },
] as const;

const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

const LABEL_CLASS = "mb-1.5 block text-label font-medium text-foreground";

export default function ScheduleForm() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [recurrence, setRecurrence] =
    useState<(typeof RECURRENCE_OPTIONS)[number]["value"]>("none");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ouverture automatique lorsqu'il fait suite à un clic sur « + » (PWA).
  const signal = useOpenFormSignal("event");

  const { data: categories } = useLiveQuery<Category[]>(
    () => db.categories.toArray(),
    []
  );

  async function addSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const start = startTime ? new Date(startTime) : new Date();
      const end = endTime
        ? new Date(endTime)
        : new Date(start.getTime() + 2 * 60 * 60 * 1000);

      await db.scheduleEvents.add({
        title: title.trim(),
        note: note.trim() || undefined,
        startDateTime: start,
        endDateTime: end,
        categoryId: categoryId ?? null,
        recurrence,
        createdAt: new Date(),
      });

      toastSuccess("Événement ajouté", title.trim());

      setTitle("");
      setNote("");
      setStartTime("");
      setEndTime("");
      setRecurrence("none");
      setCategoryId(undefined);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter l'événement.");
      toastError("Impossible d'ajouter l'événement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CollapsibleForm
      key={signal}
      defaultOpen={signal > 0}
      title="Nouvel événement"
      subtitle="Planifiez un créneau dans votre agenda"
      icon={<PlusIcon className="h-4.5 w-4.5" />}
    >
      <form onSubmit={addSchedule}>
        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-body text-danger">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="event-title" className={LABEL_CLASS}>
              Titre
            </label>
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Réunion équipe, temps de développement…"
              className={FIELD_CLASS}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-start" className={LABEL_CLASS}>
                Début
              </label>
              <input
                id="event-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label htmlFor="event-end" className={LABEL_CLASS}>
                Fin
              </label>
              <input
                id="event-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-category" className={LABEL_CLASS}>
                Catégorie
              </label>
              <select
                id="event-category"
                value={categoryId ?? ""}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : undefined)
                }
                className={FIELD_CLASS}
                disabled={(categories?.length ?? 0) === 0}
              >
                <option value="">Aucune catégorie</option>
                {(categories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {(categories?.length ?? 0) === 0 && (
                <p className="mt-1.5 text-caption text-muted-opacity">
                  Créez d&apos;abord une catégorie depuis la page « Carnet ».
                </p>
              )}
            </div>

            <div>
              <label htmlFor="event-recurrence" className={LABEL_CLASS}>
                Récurrence
              </label>
              <select
                id="event-recurrence"
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
              {recurrence !== "none" && (
                <p className="mt-1.5 text-caption text-muted-opacity">
                  L&apos;événement se répétera automatiquement.
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="event-note" className={LABEL_CLASS}>
              Note
            </label>
            <textarea
              id="event-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Détails ou lieu…"
              className={`${FIELD_CLASS} resize-y`}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            Ajouter à l&apos;emploi du temps
          </button>
        </div>
      </form>
    </CollapsibleForm>
  );
}
