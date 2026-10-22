"use client";

import { useState } from "react";
import type { Category } from "@/lib/db";
import type { Occurrence } from "@/lib/schedule";
import { RECURRENCE_LABELS } from "@/lib/schedule";
import { durationInMinutes, formatMinutes, formatTime } from "@/lib/dates";
import { accentOf } from "@/lib/scheduleDraft";
import { toastWithUndo } from "@/lib/undo";
import { addDays } from "@/lib/dates";
import { db } from "@/lib/db";
import { duplicatePayload } from "@/lib/schedule";
import { toastSuccess } from "@/lib/toast";
import { useRemoveAnimation } from "@/lib/useRemoveAnimation";
import {
  AlertTriangleIcon,
  CopyIcon,
  GripIcon,
  PencilIcon,
  RepeatIcon,
  TrashIcon,
} from "@/components/icons";

const ICON_BUTTON =
  "shrink-0 rounded-lg p-1.5 text-muted-opacity transition-colors focus:ring-4 focus:outline-none";

interface Props {
  occurrence: Occurrence;
  category?: Category;
  conflict?: boolean;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => Promise<void>;
  draggable?: boolean;
  onDragStart?: (occurrence: Occurrence) => void;
  onDragEnd?: () => void;
}

/**
 * Ligne d'un créneau : horaires, durée, catégorie, conflits éventuels et
 * actions (modifier, dupliquer au lendemain, supprimer).
 */
export default function ScheduleEventRow({
  occurrence,
  category,
  conflict = false,
  onEdit,
  onDelete,
  draggable = false,
  onDragStart,
  onDragEnd,
}: Props) {
  const { removing, remove } = useRemoveAnimation();
  const [busy, setBusy] = useState(false);
  const accent = accentOf(category);
  const { allDay, start, end, event, recurring } = occurrence;
  const duration = formatMinutes(durationInMinutes(start, end));

  async function handleDelete() {
    await remove(() => onDelete(occurrence));
  }

  /** Copie le créneau au lendemain (édition rapide sans ouvrir la modale). */
  async function duplicateToNextDay() {
    if (busy) return;
    setBusy(true);
    try {
      await db.scheduleEvents.add(duplicatePayload(event, 1));
      toastWithUndo({
        title: "Créneau dupliqué",
        description: `${event.title} · ${addDays(start, 1).toLocaleDateString(
          "fr-FR",
          { weekday: "long", day: "numeric", month: "long" }
        )}`,
        onUndo: async () => {
          const last = await db.scheduleEvents
            .orderBy("createdAt")
            .reverse()
            .first();
          if (last?.id !== undefined && last.title === event.title) {
            await db.scheduleEvents.delete(last.id);
          }
          toastSuccess("Duplication annulée", event.title);
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      draggable={draggable}
      onDragStart={
        draggable
          ? (event_) => {
              event_.dataTransfer.effectAllowed = "move";
              event_.dataTransfer.setData("text/plain", occurrence.key);
              onDragStart?.(occurrence);
            }
          : undefined
      }
      onDragEnd={draggable ? onDragEnd : undefined}
      className={`group flex items-stretch gap-3 px-4 py-3 transition-all duration-200 hover:bg-card-hover/60 ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${removing ? "scale-[0.98] opacity-0" : ""}`}
    >
      {draggable && (
        <span
          aria-hidden
          className="-ml-1 hidden shrink-0 self-center text-muted-opacity/60 sm:block"
        >
          <GripIcon className="h-4 w-4" />
        </span>
      )}

      {/* Horaires */}
      <div className="w-14 shrink-0 pt-0.5 text-right sm:w-16">
        {allDay ? (
          <span className="block text-caption font-semibold uppercase text-muted-foreground">
            Journée
          </span>
        ) : (
          <>
            <span className="block text-body font-semibold tabular-nums text-foreground">
              {formatTime(start)}
            </span>
            <span className="block text-caption tabular-nums text-muted-opacity">
              {formatTime(end)}
            </span>
          </>
        )}
      </div>

      {/* Contenu */}
      <button
        type="button"
        onClick={() => onEdit(occurrence)}
        className="relative min-w-0 flex-1 rounded-lg border-l-2 pl-4 pr-1 text-left focus:ring-4 focus:ring-primary/20 focus:outline-none"
        style={{ borderColor: accent }}
        aria-label={`Modifier ${event.title}`}
      >
        <span
          aria-hidden
          className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ring-2 ring-card"
          style={{ backgroundColor: accent }}
        />

        <p className="flex items-center gap-1.5 text-body font-medium text-foreground">
          <span className="truncate">{event.title}</span>
          {conflict && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/15 px-1.5 py-0.5 text-caption font-medium text-warning"
              title="Ce créneau chevauche un autre créneau"
            >
              <AlertTriangleIcon className="h-3 w-3" />
              Conflit
            </span>
          )}
        </p>

        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
          {!allDay && duration && <span>{duration}</span>}
          {category && (
            <span className="inline-flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
              {category.name}
            </span>
          )}
          {recurring && event.recurrence && (
            <span className="inline-flex items-center gap-1">
              <RepeatIcon className="h-3 w-3" />
              {RECURRENCE_LABELS[event.recurrence] ?? "Récurrent"}
            </span>
          )}
        </p>

        {event.note && (
          <p className="mt-1 text-caption text-muted-opacity">{event.note}</p>
        )}
      </button>

      {/* Actions */}
      <div className="flex shrink-0 items-start gap-0.5">
        <button
          type="button"
          onClick={() => onEdit(occurrence)}
          className={`${ICON_BUTTON} hover:bg-muted hover:text-foreground`}
          aria-label={`Modifier ${event.title}`}
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => void duplicateToNextDay()}
          disabled={busy}
          className={`${ICON_BUTTON} hidden hover:bg-muted hover:text-foreground disabled:opacity-50 sm:block`}
          aria-label={`Dupliquer ${event.title} au lendemain`}
        >
          <CopyIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          className={`${ICON_BUTTON} hover:bg-danger-soft hover:text-danger`}
          aria-label={`Supprimer ${event.title}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
