"use client";

import { useState } from "react";
import { db, type Category } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { PlusIcon } from "@/components/icons";

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Aucune" },
  { value: "daily", label: "Quotidienne" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuelle" },
] as const;

const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

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

      setTitle("");
      setNote("");
      setStartTime("");
      setEndTime("");
      setRecurrence("none");
      setCategoryId(undefined);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter l'événement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={addSchedule}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-base font-semibold text-foreground">
        Nouvel événement
      </h2>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="event-title"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
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
            <label
              htmlFor="event-start"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
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
            <label
              htmlFor="event-end"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
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
            <label
              htmlFor="event-category"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
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
              <p className="mt-1.5 text-xs text-muted-opacity">
                Créez d&apos;abord une catégorie depuis la page « Carnet ».
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="event-recurrence"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
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
              <p className="mt-1.5 text-xs text-muted-opacity">
                L&apos;événement se répétera automatiquement.
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="event-note"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          Ajouter à l&apos;emploi du temps
        </button>
      </div>
    </form>
  );
}
