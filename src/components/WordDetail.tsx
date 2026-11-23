"use client";

import Link from "next/link";
import { useState } from "react";
import { db, type WordEntry } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { ArrowLeftIcon, PencilIcon } from "@/components/icons";
import WordDetailCard from "@/components/WordDetailCard";
import WordEntryModal from "@/components/WordEntryModal";

interface Props {
  wordId: number;
}

export default function WordDetail({ wordId }: Props) {
  const [editing, setEditing] = useState(false);
  const { data: word, loading } = useLiveQuery<WordEntry | undefined>(
    () => db.words.get(wordId),
    [wordId]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-56 animate-pulse rounded-2xl border border-border bg-card/60" />
      </div>
    );
  }

  if (!word) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-subheading font-medium text-foreground">
          Mot introuvable
        </p>
        <p className="mt-1 text-body text-muted-foreground">
          Cette entrée a peut-être été supprimée.
        </p>
        <Link
          href="/categories"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour aux catégories
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-10 sm:px-6 lg:px-8">
      <div className="sticky top-0 z-30 -mx-4 mb-5 flex items-center justify-between gap-3 border-b border-border/70 bg-background/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Link
          href={`/categories/${word.categoryId}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-body font-medium text-foreground shadow-sm transition-colors hover:bg-muted hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour à la catégorie
        </Link>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-body font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:ring-4 focus:ring-primary/20 focus:outline-none"
        >
          <PencilIcon className="h-4 w-4" />
          Modifier
        </button>
      </div>

      <div className="animate-fade-up">
        <WordDetailCard word={word} />
      </div>

      {editing && (
        <WordEntryModal
          word={word}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
