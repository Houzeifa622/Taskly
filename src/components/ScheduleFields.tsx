"use client";

import type { Category } from "@/lib/db";
import {
  autoEnd,
  withDuration,
  type ScheduleDraft,
} from "@/lib/scheduleDraft";
import { ClockIcon } from "@/components/icons";

export const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

export const LABEL_CLASS = "mb-1.5 block text-label font-medium text-foreground";

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Aucune" },
  { value: "daily", label: "Quotidienne" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuelle" },
] as const;

const DURATION_PRESETS = [
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 h" },
  { minutes: 90, label: "1 h 30" },
  { minutes: 120, label: "2 h" },
] as const;

interface Props {
  draft: ScheduleDraft;
  onChange: (draft: ScheduleDraft) => void;
  categories: Category[];
  idPrefix: string;
  error?: string | null;
}

/**
 * Fin de répétition proposée par défaut : trois mois après le début
 * (ou aujourd'hui + 3 mois si aucune date de début n'est saisie).
 */
function defaultRecurrenceEnd(draft: ScheduleDraft): string {
  const base = draft.start
    ? new Date(draft.start.slice(0, 10) + "T12:00")
    : new Date();
  const from = Number.isNaN(base.getTime()) ? new Date() : base;
  const end = new Date(from.getFullYear(), from.getMonth() + 3, from.getDate());
  return end.toISOString().slice(0, 10);
}

/** « 24 décembre 2026 » */
function formatLongDate(value: string): string {
  const date = new Date(`${value}T12:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Bascule journée entière ↔ horaire précis en conservant la date et en
 * proposant une heure par défaut quand on revient à un créneau minuté.
 */function toggleAllDay(draft: ScheduleDraft): ScheduleDraft {
  const allDay = !draft.allDay;
  const asDate = (value: string, fallbackTime: string) => {
    if (!value) return "";
    if (allDay) return value.slice(0, 10);
    return value.length > 10 ? value.slice(0, 16) : `${value}T${fallbackTime}`;
  };

  return {
    ...draft,
    allDay,
    start: asDate(draft.start, "09:00"),
    end: asDate(draft.end, "10:00"),
  };
}

/** Champs partagés par le formulaire de création et la modale d'édition. */
export default function ScheduleFields({
  draft,
  onChange,
  categories,
  idPrefix,
  error,
}: Props) {
  const ids = {
    title: `${idPrefix}-title`,
    note: `${idPrefix}-note`,
    start: `${idPrefix}-start`,
    end: `${idPrefix}-end`,
    category: `${idPrefix}-category`,
    recurrence: `${idPrefix}-recurrence`,
    recurrenceEnd: `${idPrefix}-recurrence-end`,
  };

  function patch(values: Partial<ScheduleDraft>) {
    onChange({ ...draft, ...values });
  }

  const timeType = draft.allDay ? "date" : "datetime-local";

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
          placeholder="Ex: Réunion équipe, temps de développement…"
          className={FIELD_CLASS}
          required
        />
      </div>

      {/* Journée entière */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="text-label font-medium text-foreground">
            Journée entière
          </p>
          <p className="text-caption text-muted-foreground">
            Sans horaire précis, affiché en tête de journée.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={draft.allDay}
          aria-label="Journée entière"
          onClick={() => onChange(toggleAllDay(draft))}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:ring-4 focus:ring-primary/20 focus:outline-none ${
            draft.allDay ? "bg-primary" : "bg-input"
          }`}
        >
          <span
            aria-hidden
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              draft.allDay ? "translate-x-5.5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {!draft.allDay && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-label font-medium text-foreground">
            <ClockIcon className="h-3.5 w-3.5" />
            Durée rapide
          </p>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                type="button"
                onClick={() => onChange(withDuration(draft, preset.minutes))}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-caption font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/60 hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.start} className={LABEL_CLASS}>
            Début
          </label>
          <input
            id={ids.start}
            type={timeType}
            value={draft.start}
            onChange={(event) => onChange(autoEnd(draft, event.target.value))}
            className={FIELD_CLASS}
          />
        </div>
        <div>
          <label htmlFor={ids.end} className={LABEL_CLASS}>
            Fin
          </label>
          <input
            id={ids.end}
            type={timeType}
            value={draft.end}
            min={draft.start || undefined}
            onChange={(event) => patch({ end: event.target.value })}
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.category} className={LABEL_CLASS}>
            Catégorie
          </label>
          <select
            id={ids.category}
            value={draft.categoryId ?? ""}
            onChange={(event) =>
              patch({
                categoryId: event.target.value
                  ? Number(event.target.value)
                  : null,
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

        <div>
          <label htmlFor={ids.recurrence} className={LABEL_CLASS}>
            Récurrence
          </label>
          <select
            id={ids.recurrence}
            value={draft.recurrence}
            onChange={(event) =>
              patch({
                recurrence: event.target.value as ScheduleDraft["recurrence"],
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
          {draft.recurrence !== "none" && (
            <p className="mt-1.5 text-caption text-muted-opacity">
              Le créneau se répétera automatiquement chaque{" "}
              {draft.recurrence === "daily"
                ? "jour"
                : draft.recurrence === "weekly"
                  ? "semaine"
                  : "mois"}
              .
            </p>
          )}
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
                onChange={() => patch({ recurrenceEnd: defaultRecurrenceEnd(draft) })}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Jusqu&apos;au
            </label>

            {draft.recurrenceEnd && (
              <input
                id={ids.recurrenceEnd}
                type="date"
                value={draft.recurrenceEnd}
                min={draft.start ? draft.start.slice(0, 10) : undefined}
                onChange={(event) => patch({ recurrenceEnd: event.target.value })}
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
        <label htmlFor={ids.note} className={LABEL_CLASS}>
          Note
        </label>
        <textarea
          id={ids.note}
          value={draft.note}
          onChange={(event) => patch({ note: event.target.value })}
          rows={2}
          placeholder="Détails ou lieu…"
          className={`${FIELD_CLASS} resize-y`}
        />
      </div>
    </div>
  );
}
