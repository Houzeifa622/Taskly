"use client";

import Link from "next/link";
import { db, type WordEntry } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { ArrowLeftIcon } from "@/components/icons";

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
        <p className="text-base font-medium text-foreground">Mot introuvable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cette entrée a peut-être été supprimée.
        </p>
        <Link
          href="/categories"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
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
        className="inline-flex items-center gap-1.5 rounded-lg text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Retour à la catégorie
      </Link>

      <article className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="border-b border-border bg-gradient-to-br from-primary-soft to-transparent px-6 py-8">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Mot ou phrase
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {word.term}
          </h1>
        </header>

        <div className="space-y-6 px-6 py-6">
          {word.definition && (
            <section>
              <h2 className="text-xs font-semibold tracking-wide text-muted-opacity uppercase">
                Signification
              </h2>
              <p className="mt-2 text-lg leading-relaxed text-foreground italic">
                {word.definition}
              </p>
            </section>
          )}

          {word.usage && (
            <section>
              <h2 className="text-xs font-semibold tracking-wide text-muted-opacity uppercase">
                Comment l&apos;utiliser
              </h2>
              <p className="mt-2 rounded-xl border border-border bg-background px-4 py-3 text-base leading-relaxed text-foreground">
                {word.usage}
              </p>
            </section>
          )}

          {!word.definition && !word.usage && (
            <p className="text-sm text-muted-foreground">
              Aucune signification ni exemple n&apos;a encore été ajouté.
            </p>
          )}
        </div>

        <footer className="flex flex-col gap-1 border-t border-border bg-background/60 px-6 py-4 text-xs text-muted-opacity sm:flex-row sm:justify-between">
          <span>
            Créé le{" "}
            {word.createdAt.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span>
            Modifié le{" "}
            {word.updatedAt.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </footer>
      </article>
    </div>
  );
}
