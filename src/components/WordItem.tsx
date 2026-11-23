"use client";

import Link from "next/link";
import { useRemoveAnimation } from "@/lib/useRemoveAnimation";
import type { WordEntry } from "@/lib/db";
import { ArrowRightIcon, TrashIcon, StarIcon, CheckCircleIcon, RefreshIcon } from "@/components/icons";
import { highlightText } from "@/lib/words";

interface Props {
  word: WordEntry;
  index: number;
  onOpen: (word: WordEntry) => void;
  onDelete: (word: WordEntry) => void;
  onToggleFavorite: (word: WordEntry) => void;
  onToggleLearned: (word: WordEntry) => void;
  onMarkReviewed: (word: WordEntry) => void;
  searchQuery?: string;
}

export default function WordItem({ word, index, onOpen, onDelete, onToggleFavorite, onToggleLearned, onMarkReviewed, searchQuery = "" }: Props) {
  const { removing, remove } = useRemoveAnimation();

  async function handleDelete() {
    await remove(() => onDelete(word));
  }

  const termHtml = searchQuery.trim() ? highlightText(word.term, searchQuery) : word.term;
  const defHtml = word.definition && searchQuery.trim() ? highlightText(word.definition, searchQuery) : word.definition;

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
      className={`group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-card-hover animate-fade-up ${
        removing ? "scale-95 opacity-0" : ""
      } ${word.favorite ? "ring-1 ring-amber-400/30" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen(word)}
          className="block w-full truncate text-left font-medium text-foreground transition-colors hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none rounded"
        >
          <span dangerouslySetInnerHTML={{ __html: termHtml }} />
          {word.favorite && <span className="ml-1.5 text-amber-500">★</span>}
          {word.learned && <span className="ml-1 text-emerald-500">✓</span>}
        </button>
        {defHtml && (
          <p className="mt-0.5 truncate text-caption text-muted-foreground">
            <span dangerouslySetInnerHTML={{ __html: defHtml }} />
          </p>
        )}
        {(word.reviewCount ?? 0) > 0 && (
          <p className="mt-0.5 text-[10px] text-muted-opacity">
            Révisé {word.reviewCount} fois
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onToggleFavorite(word)}
          className={`rounded-lg p-1.5 transition-colors focus:ring-4 focus:outline-none ${word.favorite ? "text-amber-500 hover:bg-amber-500/10" : "text-muted-opacity hover:bg-muted hover:text-amber-500"}`}
          aria-label={word.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          title={word.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <StarIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onToggleLearned(word)}
          className={`rounded-lg p-1.5 transition-colors focus:ring-4 focus:outline-none ${word.learned ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-opacity hover:bg-muted hover:text-emerald-500"}`}
          aria-label={word.learned ? "Marquer à réviser" : "Marquer comme appris"}
          title={word.learned ? "Marquer à réviser" : "Marquer comme appris"}
        >
          <CheckCircleIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMarkReviewed(word)}
          className="rounded-lg p-1.5 text-muted-opacity transition-colors hover:bg-muted hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none"
          aria-label="Enregistrer une révision"
          title="Enregistrer une révision"
        >
          <RefreshIcon className="h-4 w-4" />
        </button>
        <Link
          href={`/words/${word.id}`}
          className="rounded-lg p-1.5 text-muted-opacity transition-colors hover:bg-muted hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none"
          aria-label={`Ouvrir la page de ${word.term}`}
        >
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg p-1.5 text-muted-opacity transition-colors hover:bg-danger-soft hover:text-danger focus:ring-4 focus:ring-danger/20 focus:outline-none"
          aria-label={`Supprimer ${word.term}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
