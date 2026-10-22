"use client";

import { useState } from "react";
import { db, type Category, type ScheduleTemplate } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { PlusIcon, BookmarkIcon, XIcon } from "@/components/icons";
import CollapsibleForm from "@/components/CollapsibleForm";
import ScheduleFields from "@/components/ScheduleFields";
import { useOpenFormSignal } from "@/lib/openForm";
import { toastError, toastSuccess } from "@/lib/toast";
import { durationInMinutes } from "@/lib/dates";
import {
  emptyDraft,
  eventPayload,
  nextHalfHour,
  resolveDraft,
  toDateTimeInput,
  type ScheduleDraft,
} from "@/lib/scheduleDraft";

export default function ScheduleForm() {
  const [draft, setDraft] = useState<ScheduleDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ouverture automatique lorsqu'il fait suite à un clic sur « + » (PWA).
  const signal = useOpenFormSignal("event");

  const { data: categories } = useLiveQuery<Category[]>(
    () => db.categories.toArray(),
    []
  );
  const { data: templates } = useLiveQuery<ScheduleTemplate[]>(
    () => db.scheduleTemplates.orderBy("createdAt").reverse().toArray(),
    []
  );

  const categoryList = categories ?? [];

  async function addSchedule(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;

    const resolved = resolveDraft(draft);
    if (resolved.error) {
      setError(resolved.error);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await db.scheduleEvents.add({
        ...eventPayload(draft, resolved),
        createdAt: new Date(),
      });

      toastSuccess("Événement ajouté", draft.title.trim());
      setDraft(emptyDraft());
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter l'événement.");
      toastError("Impossible d'ajouter l'événement");
    } finally {
      setSaving(false);
    }
  }

  /** Enregistre la saisie en cours comme créneau type réutilisable. */
  async function saveAsTemplate() {
    if (!draft.title.trim()) {
      setError("Saisissez d'abord un titre pour créer un modèle.");
      return;
    }

    const resolved = resolveDraft(draft);
    const duration = Math.max(
      15,
      durationInMinutes(resolved.startDateTime, resolved.endDateTime)
    );

    try {
      await db.scheduleTemplates.add({
        title: draft.title.trim(),
        note: draft.note.trim() || undefined,
        durationMinutes: duration,
        categoryId: draft.categoryId,
        recurrence: draft.recurrence,
        createdAt: new Date(),
      });
      toastSuccess("Modèle enregistré", draft.title.trim());
    } catch (err) {
      console.error(err);
      toastError("Impossible d'enregistrer le modèle");
    }
  }

  /** Remplit le formulaire depuis un modèle, à partir de maintenant. */
  function applyTemplate(template: ScheduleTemplate) {
    const start = nextHalfHour(new Date());
    setDraft({
      title: template.title,
      note: template.note ?? "",
      allDay: false,
      start: toDateTimeInput(start),
      end: toDateTimeInput(
        new Date(start.getTime() + template.durationMinutes * 60_000)
      ),
      categoryId: template.categoryId,
      recurrence: template.recurrence,
      recurrenceEnd: "",
    });
    setError(null);
  }

  async function removeTemplate(template: ScheduleTemplate) {
    if (template.id === undefined) return;
    await db.scheduleTemplates.delete(template.id);
    toastSuccess("Modèle supprimé", template.title);
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
        {(templates?.length ?? 0) > 0 && (
          <div className="mb-5">
            <p className="mb-2 flex items-center gap-1.5 text-label font-medium text-foreground">
              <BookmarkIcon className="h-3.5 w-3.5" />
              Modèles
            </p>
            <ul className="flex flex-wrap gap-2">
              {(templates ?? []).map((template) => (
                <li key={template.id} className="relative">
                  <button
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="rounded-full border border-border bg-card pl-3 pr-7 py-1.5 text-caption font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/60 hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none"
                  >
                    {template.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeTemplate(template)}
                    aria-label={`Supprimer le modèle ${template.title}`}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-opacity transition-colors hover:bg-danger-soft hover:text-danger focus:ring-4 focus:ring-danger/20 focus:outline-none"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ScheduleFields
          draft={draft}
          onChange={setDraft}
          categories={categoryList}
          idPrefix="schedule-form"
          error={error}
        />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void saveAsTemplate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-caption font-medium text-foreground transition-colors hover:bg-muted focus:ring-4 focus:ring-primary/20 focus:outline-none"
          >
            <BookmarkIcon className="h-3.5 w-3.5" />
            Enregistrer comme modèle
          </button>

          <button
            type="submit"
            disabled={saving || !draft.title.trim()}
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
