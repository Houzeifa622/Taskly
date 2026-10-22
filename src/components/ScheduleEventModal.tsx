"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import ScheduleFields from "@/components/ScheduleFields";
import type { Category } from "@/lib/db";
import type { Occurrence } from "@/lib/schedule";
import { addDays, weekdayIndex, WEEKDAY_LABELS } from "@/lib/dates";
import {
  draftForEdit,
  draftFromSlot,
  emptyDraft,
  eventPayload,
  resolveDraft,
  type ScheduleDraft,
  type Slot,
} from "@/lib/scheduleDraft";
import {
  AlertTriangleIcon,
  CopyIcon,
  RepeatIcon,
  TrashIcon,
} from "@/components/icons";

export type ScheduleModalState =
  | { key: number; mode: "create"; slot: Slot }
  | { key: number; mode: "edit"; occurrence: Occurrence };

interface Props {
  state: ScheduleModalState;
  categories: Category[];
  onClose: () => void;
  onSave: (draft: ScheduleDraft) => Promise<void>;
  onDeleteOccurrence: (occurrence: Occurrence) => Promise<void>;
  onDeleteSeries: (occurrence: Occurrence) => Promise<void>;
  onDuplicate: (occurrence: Occurrence, targetDay: Date) => Promise<void>;
}

/** Prochaine date tombant sur le jour de semaine voulu, après `date`. */
function nextWeekday(date: Date, weekday: number): Date {
  const delta = ((weekday - weekdayIndex(date) + 7) % 7) || 7;
  return addDays(date, delta);
}

const SECONDARY_BUTTON =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-caption font-medium text-foreground transition-colors hover:bg-muted focus:ring-4 focus:ring-primary/20 focus:outline-none";

export default function ScheduleEventModal({
  state,
  categories,
  onClose,
  onSave,
  onDeleteOccurrence,
  onDeleteSeries,
  onDuplicate,
}: Props) {
  const editing = state.mode === "edit";
  const occurrence = state.mode === "edit" ? state.occurrence : null;

  const [draft, setDraft] = useState<ScheduleDraft>(() =>
    state.mode === "edit"
      ? draftForEdit(state.occurrence)
      : draftFromSlot(state.slot)
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Préfixe d'identifiants : deux modales ne peuvent pas être ouvertes ensemble,
  // mais un identifiant unique évite toute collision avec le formulaire rapide.
  const idPrefix = `schedule-modal-${state.key}`;
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const recurring =
    occurrence?.recurring === true &&
    (occurrence.event.recurrence ?? "none") !== "none";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError("Donnez un titre à ce créneau.");
      return;
    }

    const resolved = resolveDraft(draft);
    if (resolved.error) {
      setError(resolved.error);
      return;
    }
    if (resolved.endDateTime <= resolved.startDateTime) {
      setError("L'heure de fin doit suivre l'heure de début.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await onSave(draft);
    } catch (err) {
      console.error(err);
      setError("Impossible d'enregistrer le créneau.");
      setBusy(false);
    }
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      console.error(err);
      setError("L'action a échoué.");
      setBusy(false);
    }
  }

  const duplicateTargets = occurrence
    ? Array.from({ length: 7 }, (_, index) => nextWeekday(occurrence.start, index))
    : [];

  return (
    <Modal
      open
      onClose={onClose}
      variant="sheet"
      title={editing ? "Modifier le créneau" : "Nouveau créneau"}
      description={
        editing && occurrence
          ? occurrence.event.title
          : "Renseignez les informations du créneau."
      }
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="order-2 rounded-xl border border-border px-4 py-2.5 text-body font-medium text-foreground transition-colors hover:bg-muted focus:ring-4 focus:ring-primary/20 focus:outline-none sm:order-1"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="schedule-event-form"
            disabled={busy}
            className="order-1 rounded-xl bg-primary px-5 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50 sm:order-2"
          >
            {editing ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      }
    >
      <form id="schedule-event-form" onSubmit={handleSubmit}>
        {recurring && (
          <p className="mb-4 flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-caption text-foreground">
            <RepeatIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <span>
              Série récurrente : les modifications s&apos;appliquent à toutes les
              occurrences, depuis le{" "}
              {occurrence.event.startDateTime.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </span>
          </p>
        )}

        <ScheduleFields
          draft={draft}
          onChange={setDraft}
          categories={categories}
          idPrefix={idPrefix}
          error={error}
        />

        {occurrence && (
          <div className="mt-5 space-y-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDuplicate((value) => !value)}
                aria-expanded={showDuplicate}
                className={SECONDARY_BUTTON}
                disabled={busy}
              >
                <CopyIcon className="h-3.5 w-3.5" />
                Dupliquer vers…
              </button>

              <button
                type="button"
                onClick={() => setConfirmDelete((value) => !value)}
                aria-expanded={confirmDelete}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-danger/30 bg-danger-soft px-3 py-1.5 text-caption font-medium text-danger transition-colors hover:bg-danger/10 focus:ring-4 focus:ring-danger/20 focus:outline-none"
                disabled={busy}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>

            {showDuplicate && (
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="mb-2 text-caption font-medium text-foreground">
                  Copier ce créneau sur…
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {duplicateTargets.map((target, index) => (
                    <button
                      key={WEEKDAY_LABELS[index]}
                      type="button"
                      onClick={() =>
                        run(() => onDuplicate(occurrence, target))
                      }
                      disabled={busy}
                      className="flex min-w-11 flex-col items-center rounded-lg border border-border bg-card px-2 py-1.5 text-caption transition-colors hover:border-primary/40 hover:bg-primary-soft/60 focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:opacity-50"
                    >
                      <span className="font-medium text-foreground">
                        {WEEKDAY_LABELS[index]}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {target.getDate()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {confirmDelete && (
              <div className="rounded-xl border border-danger/30 bg-danger-soft p-3">
                <p className="mb-2 flex items-center gap-1.5 text-caption font-medium text-danger">
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                  Confirmer la suppression
                </p>
                <div className="flex flex-wrap gap-2">
                  {recurring ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          run(() => onDeleteOccurrence(occurrence))
                        }
                        disabled={busy}
                        className="rounded-lg border border-danger/40 bg-card px-3 py-1.5 text-caption font-medium text-danger transition-colors hover:bg-danger/10 focus:ring-4 focus:ring-danger/20 focus:outline-none disabled:opacity-50"
                      >
                        Cette occurrence
                      </button>
                      <button
                        type="button"
                        onClick={() => run(() => onDeleteSeries(occurrence))}
                        disabled={busy}
                        className="rounded-lg bg-danger px-3 py-1.5 text-caption font-medium text-white transition-colors hover:opacity-90 focus:ring-4 focus:ring-danger/20 focus:outline-none disabled:opacity-50"
                      >
                        Toute la série
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => run(() => onDeleteSeries(occurrence))}
                      disabled={busy}
                      className="rounded-lg bg-danger px-3 py-1.5 text-caption font-medium text-white transition-colors hover:opacity-90 focus:ring-4 focus:ring-danger/20 focus:outline-none disabled:opacity-50"
                    >
                      Supprimer définitivement
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
