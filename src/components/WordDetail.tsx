"use client";

import Link from "next/link";
import { db, type WordEntry } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { ArrowLeftIcon } from "@/components/icons";
import WordDetailCard from "@/components/WordDetailCard";

interface Props {
  wordId: number;
}

export default function WordDetail({ wordId }: Props) {
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
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/categories/${word.categoryId}`}
        className="inline-flex items-center gap-1.5 rounded-lg text-body text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Retour à la catégorie
      </Link>

      <div className="mt-5 animate-fade-up">
        <WordDetailCard word={word} />
      </div>
    </div>
  );
}
