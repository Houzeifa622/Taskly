"use client";

import type { Category } from "@/lib/db";
import {
  defaultRecurrenceEnd,
  type TaskDraft,
} from "@/lib/taskDraft";
import { dayInputValue, parseDayInput } from "@/lib/tasks";

export const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

export const LABEL_CLASS = "mb-1.5 block text-label font-medium text-foreground";

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

interface Props {
  draft: TaskDraft;
  onChange: (draft: TaskDraft) => void;
  categories: Category[];
  idPrefix: string;
  error?: string | null;
}

/** « 24 décembre 2026 » */
function formatLongDate(value: string): string {
  const date = parseDayInput(value);
  if (!date) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Champs partagés par le formulaire de création et la modale d'édition. */
export default function TaskFields({
  draft,
  onChange,
  categories,
  idPrefix,
  error,
}: Props) {
  const ids = {
    title: `${idPrefix}-title`,
    note: `${idPrefix}-note`,
    dueDate: `${idPrefix}-due-date`,
    dueTime: `${idPrefix}-due-time`,
    priority: `${idPrefix}-priority`,
    recurrence: `${idPrefix}-recurrence`,
    recurrenceEnd: `${idPrefix}-recurrence-end`,
    category: `${idPrefix}-category`,
  };

  function patch(values: Partial<TaskDraft>) {
    onChange({ ...draft, ...values });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-body text-danger"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor={ids.title} className={LABEL_CLASS}>
          Titre
        </label>
        <input
          id={ids.title}
          type="text"
          value={draft.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="Ex: Récupérer les documents, implémenter la fonction X…"
          className={FIELD_CLASS}
          required
        />
      </div>

      <div>
        <label htmlFor={ids.note} className={LABEL_CLASS}>
          Note
        </label>
        <textarea
          id={ids.note}
          value={draft.note}
          onChange={(event) => patch({ note: event.target.value })}
          rows={2}
          placeholder="Détails ou précision…"
          className={`${FIELD_CLASS} resize-y`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.dueDate} className={LABEL_CLASS}>
            Date prévue
          </label>
          <input
            id={ids.dueDate}
            type="date"
            value={draft.dueDate}
            onChange={(event) =>
              patch({
                dueDate: event.target.value,
                dueTime: event.target.value ? draft.dueTime : "",
              })
            }
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor={ids.dueTime} className={LABEL_CLASS}>
            Heure <span className="font-normal text-muted-opacity">(facultative)</span>
          </label>
          <input
            id={ids.dueTime}
            type="time"
            value={draft.dueTime}
            onChange={(event) => patch({ dueTime: event.target.value })}
            disabled={!draft.dueDate}
            className={`${FIELD_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.priority} className={LABEL_CLASS}>
            Priorité
          </label>
          <select
            id={ids.priority}
            value={draft.priority}
            onChange={(event) =>
              patch({ priority: event.target.value as TaskDraft["priority"] })
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
          <label htmlFor={ids.recurrence} className={LABEL_CLASS}>
            Récurrence
          </label>
          <select
            id={ids.recurrence}
            value={draft.recurrence}
            onChange={(event) =>
              patch({
                recurrence: event.target.value as TaskDraft["recurrence"],
                recurrenceEnd:
                  event.target.value === "none" ? "" : draft.recurrenceEnd,
              })
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

      {draft.recurrence !== "none" && (
        <fieldset className="rounded-xl border border-border bg-muted/40 px-3.5 py-3">
          <legend className={LABEL_CLASS}>Fin de la répétition</legend>

          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-caption text-foreground">
              <input
                type="radio"
                name={`${idPrefix}-recurrence-end`}
                checked={!draft.recurrenceEnd}
                onChange={() => patch({ recurrenceEnd: "" })}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Sans fin
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-caption text-foreground">
              <input
                type="radio"
                name={`${idPrefix}-recurrence-end`}
                checked={Boolean(draft.recurrenceEnd)}
                onChange={() =>
                  patch({ recurrenceEnd: defaultRecurrenceEnd(draft) })
                }
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Jusqu&apos;au
            </label>

            {draft.recurrenceEnd && (
              <input
                id={ids.recurrenceEnd}
                type="date"
                value={draft.recurrenceEnd}
                min={draft.dueDate || dayInputValue(new Date())}
                onChange={(event) =>
                  patch({ recurrenceEnd: event.target.value })
                }
                aria-label="Dernier jour de la répétition"
                className={FIELD_CLASS}
              />
            )}
          </div>

          {draft.recurrenceEnd && (
            <p className="mt-2 text-caption text-muted-opacity">
              La répétition s&apos;arrêtera après le{" "}
              {formatLongDate(draft.recurrenceEnd)}.
            </p>
          )}
        </fieldset>
      )}

      <div>
        <label htmlFor={ids.category} className={LABEL_CLASS}>
          Catégorie
        </label>
        <select
          id={ids.category}
          value={draft.categoryId ?? ""}
          onChange={(event) =>
            patch({
              categoryId: event.target.value ? Number(event.target.value) : null,
            })
          }
          className={FIELD_CLASS}
          disabled={categories.length === 0}
        >
          <option value="">Aucune catégorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="mt-1.5 text-caption text-muted-opacity">
            Créez d&apos;abord une catégorie depuis la page « Carnet ».
          </p>
        )}
      </div>
    </div>
  );
}
