"use client";

import { useState } from "react";
import type { Category } from "@/lib/db";
import { MOMENT_LABELS, type Moment } from "@/lib/schedule";
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
  SunHorizonIcon,
  XIcon,
} from "@/components/icons";

export type ScheduleView = "day" | "week" | "grid" | "month" | "list";

export interface ScheduleFilters {
  query: string;
  categoryId: number | null;
  moments: Moment[];
  hidePast: boolean;
}

export const EMPTY_FILTERS: ScheduleFilters = {
  query: "",
  categoryId: null,
  moments: [],
  hidePast: false,
};

const VIEWS: { value: ScheduleView; label: string; icon: React.ReactNode }[] = [
  { value: "day", label: "Jour", icon: <SunHorizonIcon className="h-3.5 w-3.5" /> },
  { value: "week", label: "Semaine", icon: <CalendarIcon className="h-3.5 w-3.5" /> },
  { value: "grid", label: "Grille", icon: <GridIcon className="h-3.5 w-3.5" /> },
  { value: "month", label: "Mois", icon: <CalendarIcon className="h-3.5 w-3.5" /> },
  { value: "list", label: "Liste", icon: <ListIcon className="h-3.5 w-3.5" /> },
];

const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

const CHIP_CLASS =
  "rounded-full border px-3 py-1.5 text-caption font-medium transition-colors focus:ring-4 focus:ring-primary/20 focus:outline-none";

interface Props {
  view: ScheduleView;
  onViewChange: (view: ScheduleView) => void;
  periodText: string;
  onShift: (delta: number) => void;
  shiftLabels: { previous: string; next: string };
  onToday: () => void;
  isCurrentPeriod: boolean;
  todayLabel: string;
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  categories: Category[];
  resultCount: number;
}

/** Barre d'outils de l'emploi du temps : vues, navigation et filtres. */
export default function ScheduleToolbar({
  view,
  onViewChange,
  periodText,
  onShift,
  shiftLabels,
  onToday,
  isCurrentPeriod,
  todayLabel,
  filters,
  onFiltersChange,
  categories,
  resultCount,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);

  const activeCount =
    (filters.query ? 1 : 0) +
    (filters.categoryId !== null ? 1 : 0) +
    filters.moments.length +
    (filters.hidePast ? 1 : 0);

  function patch(values: Partial<ScheduleFilters>) {
    onFiltersChange({ ...filters, ...values });
  }

  function toggleMoment(moment: Moment) {
    patch({
      moments: filters.moments.includes(moment)
        ? filters.moments.filter((item) => item !== moment)
        : [...filters.moments, moment],
    });
  }

  return (
    <div className="space-y-3">
      {/* Vues + navigation */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 shadow-sm">
        <div
          role="group"
          aria-label="Type de vue"
          className="flex flex-wrap gap-1 rounded-lg bg-muted/60 p-1"
        >
          {VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onViewChange(option.value)}
              aria-pressed={view === option.value}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-caption font-medium transition-colors focus:ring-4 focus:ring-primary/20 focus:outline-none ${
                view === option.value
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {view !== "list" && (
          <div className="ml-auto flex flex-1 items-center justify-end gap-1 sm:flex-none">
            <button
              type="button"
              onClick={() => onShift(-1)}
              aria-label={shiftLabels.previous}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:ring-4 focus:ring-primary/20 focus:outline-none"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onShift(1)}
              aria-label={shiftLabels.next}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:ring-4 focus:ring-primary/20 focus:outline-none"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToday}
              disabled={isCurrentPeriod}
              className="rounded-lg px-2.5 py-1.5 text-caption font-medium text-primary transition-colors hover:bg-primary-soft focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:pointer-events-none disabled:text-muted-opacity"
            >
              {todayLabel}
            </button>
          </div>
        )}
      </div>

      {/* Période affichée + recherche */}
      <div className="flex flex-wrap items-center gap-2">
        {view !== "list" && (
          <p className="flex-1 truncate text-subheading font-semibold capitalize text-foreground">
            {periodText}
          </p>
        )}

        <div className="relative ml-auto w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-opacity" />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => patch({ query: event.target.value })}
            placeholder="Rechercher un créneau…"
            aria-label="Rechercher un créneau"
            className={`${FIELD_CLASS} pl-9`}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          aria-expanded={showFilters}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-caption font-medium transition-colors focus:ring-4 focus:ring-primary/20 focus:outline-none ${
            showFilters || activeCount > 0
              ? "border-primary/40 bg-primary-soft text-primary"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          <FilterIcon className="h-3.5 w-3.5" />
          Filtres
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-caption font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="space-y-4 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
          <div>
            <p className="mb-2 text-caption font-semibold uppercase text-muted-foreground">
              Catégorie
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => patch({ categoryId: null })}
                aria-pressed={filters.categoryId === null}
                className={`${CHIP_CLASS} ${
                  filters.categoryId === null
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Toutes
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => patch({ categoryId: category.id ?? null })}
                  aria-pressed={filters.categoryId === category.id}
                  className={`${CHIP_CLASS} inline-flex items-center gap-1.5 ${
                    filters.categoryId === category.id
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color ?? "var(--primary)" }}
                  />
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-caption font-semibold uppercase text-muted-foreground">
              Moment de la journée
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(MOMENT_LABELS) as Moment[]).map((moment) => (
                <button
                  key={moment}
                  type="button"
                  onClick={() => toggleMoment(moment)}
                  aria-pressed={filters.moments.includes(moment)}
                  className={`${CHIP_CLASS} ${
                    filters.moments.includes(moment)
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {MOMENT_LABELS[moment]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-caption text-foreground">
              <input
                type="checkbox"
                checked={filters.hidePast}
                onChange={(event) => patch({ hidePast: event.target.checked })}
                className="h-4 w-4 rounded border-border accent-[var(--primary)]"
              />
              Masquer les créneaux passés
            </label>

            <div className="flex items-center gap-3">
              <span className="text-caption tabular-nums text-muted-foreground">
                {resultCount} résultat{resultCount > 1 ? "s" : ""}
              </span>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => onFiltersChange(EMPTY_FILTERS)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-caption font-medium text-primary transition-colors hover:bg-primary-soft focus:ring-4 focus:ring-primary/20 focus:outline-none"
                >
                  <XIcon className="h-3 w-3" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Résumé compact hors panneau */}
      {!showFilters && activeCount > 0 && (
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <CheckIcon className="h-3.5 w-3.5 text-primary" />
          {activeCount} filtre{activeCount > 1 ? "s" : ""} actif
          {activeCount > 1 ? "s" : ""} · {resultCount} résultat
          {resultCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
