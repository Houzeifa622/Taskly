"use client";

import Link from "next/link";
import { useRemoveAnimation } from "@/lib/useRemoveAnimation";
import type { WordEntry } from "@/lib/db";
import { ArrowRightIcon, TrashIcon } from "@/components/icons";

interface Props {
  word: WordEntry;
  index: number;
  onOpen: (word: WordEntry) => void;
  onDelete: (word: WordEntry) => void;
}

export default function WordItem({ word, index, onOpen, onDelete }: Props) {
  const { removing, remove } = useRemoveAnimation();

  async function handleDelete() {
    await remove(() => onDelete(word));
  }

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
      className={`group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-card-hover animate-fade-up ${
        removing ? "scale-95 opacity-0" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen(word)}
          className="block w-full truncate text-left font-medium text-foreground transition-colors hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none rounded"
        >
          {word.term}
        </button>
        {word.definition && (
          <p className="mt-0.5 truncate text-caption text-muted-foreground">
            {word.definition}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/words/${word.id}`}
          className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-muted hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none"
          aria-label={`Ouvrir la page de ${word.term}`}
        >
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-danger-soft hover:text-danger focus:ring-4 focus:ring-danger/20 focus:outline-none"
          aria-label={`Supprimer ${word.term}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
