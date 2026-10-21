"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { db, type WordEntry } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { ArrowRightIcon, TrashIcon } from "@/components/icons";

interface Props {
  categoryId: number;
  categoryName: string;
}

export default function WordList({ categoryId, categoryName }: Props) {
  const [search, setSearch] = useState("");

  const { data: rawWords, loading } = useLiveQuery<WordEntry[]>(
    () => db.words.where("categoryId").equals(categoryId).toArray(),
    [categoryId]
  );

  const words = useMemo(() => {
    const list = rawWords ?? [];
    return [...list].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [rawWords]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return words;
    return words.filter(
      (word) =>
        word.term.toLowerCase().includes(query) ||
        word.definition?.toLowerCase().includes(query)
    );
  }, [words, search]);

  async function deleteWord(word: WordEntry) {
    const id = word.id;
    if (id === undefined) return;
    if (!window.confirm(`Supprimer « ${word.term} » ?`)) return;

    try {
      await db.words.delete(id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {categoryName}
          </h2>
          <p className="text-xs text-muted-foreground">
            {words.length} {words.length > 1 ? "entrées" : "entrée"}
          </p>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none sm:w-64"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-border bg-card/60"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {search ? "Aucun résultat" : "Aucun mot enregistré"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "Essayez un autre terme de recherche."
              : "Ajoutez votre premier mot ou phrase avec le formulaire ci-dessus."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((word) => (
            <li
              key={word.id}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/40 hover:bg-card-hover"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/words/${word.id}`}
                  className="block truncate font-medium text-foreground transition-colors hover:text-primary"
                >
                  {word.term}
                </Link>
                {word.definition && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {word.definition}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/words/${word.id}`}
                  className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-muted hover:text-primary"
                  aria-label={`Voir ${word.term}`}
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => deleteWord(word)}
                  className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-danger-soft hover:text-danger"
                  aria-label={`Supprimer ${word.term}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
