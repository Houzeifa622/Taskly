"use client";

import { useMemo, useState } from "react";
import { db, type Category, type ScheduleEvent } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import {
  expandEvents,
  findConflictKeys,
  minutesByDay,
  movedSeriesStart,
  periodLabel,
  momentOf,
  type Occurrence,
} from "@/lib/schedule";
import {
  addDays,
  dayKey,
  startOfDay,
  startOfWeek,
} from "@/lib/dates";
import { toastWithUndo } from "@/lib/undo";
import { toastSuccess } from "@/lib/toast";
import {
  eventPayload,
  resolveDraft,
  type ScheduleDraft,
} from "@/lib/scheduleDraft";
import ScheduleToolbar, {
  EMPTY_FILTERS,
  type ScheduleFilters,
  type ScheduleView,
} from "@/components/ScheduleToolbar";
import ScheduleEventModal, {
  type ScheduleModalState,
} from "@/components/ScheduleEventModal";
import ScheduleDayView from "@/components/ScheduleDayView";
import ScheduleWeekView from "@/components/ScheduleWeekView";
import ScheduleGridView from "@/components/ScheduleGridView";
import ScheduleMonthView from "@/components/ScheduleMonthView";
import ScheduleListView from "@/components/ScheduleListView";
import ScheduleLoadBar from "@/components/ScheduleLoadBar";

const SHIFT_LABELS: Record<
  Exclude<ScheduleView, "list">,
  { previous: string; next: string }
> = {
  day: { previous: "Jour précédent", next: "Jour suivant" },
  week: { previous: "Semaine précédente", next: "Semaine suivante" },
  grid: { previous: "Semaine précédente", next: "Semaine suivante" },
  month: { previous: "Mois précédent", next: "Mois suivant" },
};

const TODAY_LABELS: Record<Exclude<ScheduleView, "list">, string> = {
  day: "Aujourd'hui",
  week: "Cette semaine",
  grid: "Cette semaine",
  month: "Ce mois",
};

/** Fenêtre temporelle déployée selon la vue (bornes incluses). */
function rangeFor(view: ScheduleView, cursor: Date): { from: Date; to: Date } {
  if (view === "day") {
    return { from: startOfDay(cursor), to: startOfDay(cursor) };
  }
  if (view === "week" || view === "grid") {
    const monday = startOfWeek(cursor);
    return { from: monday, to: addDays(monday, 6) };
  }
  if (view === "month") {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    return { from: startOfWeek(first), to: addDays(startOfWeek(last), 6) };
  }
  return { from: startOfDay(cursor), to: addDays(startOfDay(cursor), 3650) };
}

/** Vrai si l'occurrence passe les filtres actifs. */
function matchesFilters(
  occurrence: Occurrence,
  filters: ScheduleFilters,
  now: Date
): boolean {
  const term = filters.query.trim().toLowerCase();
  if (term) {
    const haystack = `${occurrence.event.title} ${
      occurrence.event.note ?? ""
    }`.toLowerCase();
    if (!haystack.includes(term)) return false;
  }

  if (
    filters.categoryId !== null &&
    occurrence.event.categoryId !== filters.categoryId
  ) {
    return false;
  }

  if (filters.moments.length > 0) {
    if (occurrence.allDay) return false;
    if (!filters.moments.includes(momentOf(occurrence.start))) return false;
  }

  if (filters.hidePast && !occurrence.allDay && occurrence.end < now) {
    return false;
  }

  return true;
}

export default function ScheduleList() {
  const [view, setView] = useState<ScheduleView>("week");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [filters, setFilters] = useState<ScheduleFilters>(EMPTY_FILTERS);
  const [modal, setModal] = useState<ScheduleModalState | null>(null);

  const { data: rawEvents, loading } = useLiveQuery<ScheduleEvent[]>(
    () => db.scheduleEvents.toArray(),
    []
  );
  const { data: rawCategories } = useLiveQuery<Category[]>(
    () => db.categories.toArray(),
    []
  );

  const events = useMemo(() => rawEvents ?? [], [rawEvents]);
  const categories = useMemo(() => rawCategories ?? [], [rawCategories]);

  const categoriesById = useMemo(() => {
    const map = new Map<number, Category>();
    for (const category of categories) {
      if (category.id !== undefined) map.set(category.id, category);
    }
    return map;
  }, [categories]);

  const range = useMemo(() => rangeFor(view, cursor), [view, cursor]);

  const occurrences = useMemo(
    () => expandEvents(events, range.from, range.to),
    [events, range]
  );

  const visible = useMemo(() => {
    const now = new Date();
    return occurrences.filter((occurrence) =>
      matchesFilters(occurrence, filters, now)
    );
  }, [occurrences, filters]);

  const conflicts = useMemo(() => findConflictKeys(visible), [visible]);

  const isCurrentPeriod = useMemo(() => {
    const today = startOfDay(new Date());
    if (view === "day") return dayKey(cursor) === dayKey(today);
    if (view === "week" || view === "grid") {
      return dayKey(startOfWeek(cursor)) === dayKey(startOfWeek(today));
    }
    if (view === "month") {
      return (
        cursor.getMonth() === today.getMonth() &&
        cursor.getFullYear() === today.getFullYear()
      );
    }
    return true;
  }, [view, cursor]);

  const loadDays = useMemo(() => {
    const monday = startOfWeek(cursor);
    const minutes = minutesByDay(visible);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(monday, index);
      return { key: dayKey(date), date, minutes: minutes.get(dayKey(date)) ?? 0 };
    });
  }, [cursor, visible]);

  /* ------------------------------- actions ------------------------------- */

  function openCreate(slot: { start: Date; end: Date; allDay?: boolean }) {
    setModal({ key: Date.now(), mode: "create", slot });
  }

  function openCreateAtDay(date: Date) {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    openCreate({ start, end: new Date(start.getTime() + 3_600_000) });
  }

  function openEdit(occurrence: Occurrence) {
    setModal({ key: Date.now(), mode: "edit", occurrence });
  }

  async function saveFromModal(draft: ScheduleDraft) {
    const resolved = resolveDraft(draft);
    const payload = eventPayload(draft, resolved);

    if (modal?.mode === "edit") {
      const { occurrence } = modal;
      const id = occurrence.event.id;
      if (id === undefined) return;

      const recurring = (occurrence.event.recurrence ?? "none") !== "none";
      await db.scheduleEvents.update(id, payload);
      setModal(null);
      toastSuccess(
        recurring ? "Série mise à jour" : "Créneau modifié",
        payload.title
      );
      return;
    }

    await db.scheduleEvents.add({ ...payload, createdAt: new Date() });
    setModal(null);
    toastSuccess("Événement ajouté", payload.title);
  }

  function snapshotPayload(event: ScheduleEvent) {
    return {
      title: event.title,
      note: event.note,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      allDay: event.allDay,
      categoryId: event.categoryId,
      recurrence: event.recurrence,
      recurrenceEnd: event.recurrenceEnd ?? null,
      exceptions: event.exceptions,
      createdAt: event.createdAt,
    };
  }

  async function deleteSeries(occurrence: Occurrence) {
    const id = occurrence.event.id;
    if (id === undefined) return;

    const snapshot = snapshotPayload(occurrence.event);
    await db.scheduleEvents.delete(id);
    setModal(null);


    toastWithUndo({
      title: "Créneau supprimé",
      description: snapshot.title,
      onUndo: async () => {
        await db.scheduleEvents.add(snapshot);
      },
    });
  }

  async function deleteOccurrence(occurrence: Occurrence) {
    const event = occurrence.event;
    const id = event.id;
    if (id === undefined) return;

    const previousExceptions = event.exceptions ?? [];
    const exceptions = [...new Set([...previousExceptions, occurrence.dayKey])];

    await db.scheduleEvents.update(id, { exceptions });
    setModal(null);

    toastWithUndo({
      title: "Occurrence supprimée",
      description: `${event.title} · ${occurrence.start.toLocaleDateString(
        "fr-FR",
        { day: "numeric", month: "long" }
      )}`,
      onUndo: async () => {
        await db.scheduleEvents.update(id, { exceptions: previousExceptions });
      },
    });
  }

  async function duplicateTo(occurrence: Occurrence, target: Date) {
    const shifted = movedSeriesStart(occurrence.event, target);
    const { id: _ignored, createdAt: _createdAt, ...rest } = occurrence.event;

    await db.scheduleEvents.add({
      ...rest,
      startDateTime: shifted.startDateTime,
      endDateTime: shifted.endDateTime,
      recurrence: "none",
      exceptions: [],
      createdAt: new Date(),
    });

    setModal(null);
    toastSuccess(
      "Créneau dupliqué",
      target.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    );
  }

  /**
   * Déplacement par glisser-déposer.
   * `keepTime` conserve l'heure du créneau (dépôt sur une journée) ;
   * sinon l'heure de `target` est utilisée (dépôt sur la grille horaire).
   */
  async function moveOccurrence(
    occurrence: Occurrence,
    target: Date,
    keepTime = true
  ) {
    const id = occurrence.event.id;
    if (id === undefined) return;

    const effective = keepTime
      ? new Date(
          target.getFullYear(),
          target.getMonth(),
          target.getDate(),
          occurrence.start.getHours(),
          occurrence.start.getMinutes()
        )
      : target;

    const previous = {
      startDateTime: occurrence.event.startDateTime,
      endDateTime: occurrence.event.endDateTime,
    };
    const shifted = movedSeriesStart(occurrence.event, effective);

    if (
      shifted.startDateTime.getTime() === previous.startDateTime.getTime() &&
      shifted.endDateTime.getTime() === previous.endDateTime.getTime()
    ) {
      return;
    }

    await db.scheduleEvents.update(id, shifted);

    const recurring = (occurrence.event.recurrence ?? "none") !== "none";
    toastWithUndo({
      title: recurring ? "Série déplacée" : "Créneau déplacé",
      description: `${occurrence.event.title} · ${shifted.startDateTime.toLocaleDateString(
        "fr-FR",
        { weekday: "long", day: "numeric", month: "long" }
      )}`,
      onUndo: async () => {
        await db.scheduleEvents.update(id, previous);
      },
    });
  }

  function shift(delta: number) {
    if (view === "month") {
      setCursor((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1));
      return;
    }
    setCursor((date) => addDays(date, view === "day" ? delta : delta * 7));
  }

  const hasAnyEvent = events.length > 0;

  return (
    <section className="mt-6 space-y-4">
      <ScheduleToolbar
        view={view}
        onViewChange={setView}
        periodText={periodLabel(view, cursor)}
        onShift={shift}
        shiftLabels={
          view === "list"
            ? { previous: "", next: "" }
            : SHIFT_LABELS[view as Exclude<ScheduleView, "list">]
        }
        onToday={() => setCursor(startOfDay(new Date()))}
        isCurrentPeriod={isCurrentPeriod}
        todayLabel={
          view === "list" ? "Aujourd'hui" : TODAY_LABELS[view as Exclude<ScheduleView, "list">]
        }
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        resultCount={visible.length}
      />

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl border border-border bg-card/60"
            />
          ))}
        </div>
      ) : (
        <>
          {view === "day" && (
            <ScheduleDayView
              date={cursor}
              occurrences={visible}
              categoriesById={categoriesById}
              conflicts={conflicts}
              onEdit={openEdit}
              onDelete={deleteSeries}
              onCreate={openCreateAtDay}
            />
          )}

          {view === "week" && (
            <ScheduleWeekView
              cursor={cursor}
              occurrences={visible}
              categoriesById={categoriesById}
              conflicts={conflicts}
              onEdit={openEdit}
              onDelete={deleteSeries}
              onCreate={openCreateAtDay}
              onMoveOccurrence={moveOccurrence}
            />
          )}

          {view === "grid" && (
            <ScheduleGridView
              cursor={cursor}
              occurrences={visible}
              categoriesById={categoriesById}
              conflicts={conflicts}
              onEdit={openEdit}
              onCreate={openCreateAtDay}
              onMoveOccurrence={moveOccurrence}
            />
          )}

          {view === "month" && (
            <ScheduleMonthView
              cursor={cursor}
              occurrences={visible}
              categoriesById={categoriesById}
              onEdit={openEdit}
              onCreate={openCreateAtDay}
              onSelectDay={(date) => {
                setCursor(startOfDay(date));
                setView("day");
              }}
              onShiftMonth={shift}
            />
          )}

          {view === "list" && (
            <ScheduleListView
              occurrences={visible}
              categoriesById={categoriesById}
              conflicts={conflicts}
              onEdit={openEdit}
              onDelete={deleteSeries}
              onCreate={openCreateAtDay}
              hasAnyEvent={hasAnyEvent}
            />
          )}

          {(view === "week" || view === "grid") && (
            <ScheduleLoadBar
              days={loadDays}
              occurrences={visible}
              categoriesById={categoriesById}
            />
          )}

          {view !== "list" && visible.length > 0 && (
            <p className="text-center text-caption text-muted-opacity">
              {visible.length} créneau{visible.length > 1 ? "x" : ""} affiché
              {visible.length > 1 ? "s" : ""}
              {visible.some((occurrence) => occurrence.recurring)
                ? " · les séries récurrentes sont déployées automatiquement"
                : ""}
            </p>
          )}
        </>
      )}

      {modal && (
        <ScheduleEventModal
          state={modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={saveFromModal}
          onDeleteOccurrence={deleteOccurrence}
          onDeleteSeries={deleteSeries}
          onDuplicate={duplicateTo}
        />
      )}
    </section>
  );
}
