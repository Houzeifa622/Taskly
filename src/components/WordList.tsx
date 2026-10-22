"use client";

import { useMemo, useState } from "react";
import { db, type WordEntry } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { SearchIcon } from "@/components/icons";
import EmptyState from "@/components/EmptyState";
import WordItem from "@/components/WordItem";
import WordDetailModal from "@/components/WordDetailModal";
import {
  EmptyNotebookIllustration,
  EmptySearchIllustration,
} from "@/components/illustrations";
import { toastWithUndo } from "@/lib/undo";

interface Props {
  categoryId: number;
  categoryName: string;
}

export default function WordList({ categoryId, categoryName }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WordEntry | null>(null);

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

    const snapshot = { ...word };

    try {
      await db.words.delete(id);
      toastWithUndo({
        title: "Entrée supprimée",
        description: snapshot.term,
        onUndo: async () => {
          await db.words.add({
            term: snapshot.term,
            categoryId: snapshot.categoryId,
            definition: snapshot.definition,
            usage: snapshot.usage,
            createdAt: snapshot.createdAt,
            updatedAt: snapshot.updatedAt,
          });
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-subheading font-semibold text-foreground">
            {categoryName}
          </h2>
          <p className="text-caption text-muted-foreground">
            {words.length} {words.length > 1 ? "entrées" : "entrée"}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-opacity" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher dans cette catégorie"
            className="w-full rounded-xl border border-border bg-background py-2 pr-4 pl-10 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none"
          />
        </div>
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
        <EmptyState
          illustration={
            search ? (
              <EmptySearchIllustration />
            ) : (
              <EmptyNotebookIllustration />
            )
          }
          title={search ? "Aucun résultat" : "Aucun mot enregistré"}
          description={
            search
              ? "Essayez un autre terme de recherche."
              : "Ajoutez votre premier mot ou phrase avec le formulaire ci-dessus."
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((word, index) => (
            <WordItem
              key={word.id}
              word={word}
              index={index}
              onOpen={setSelected}
              onDelete={deleteWord}
            />
          ))}
        </ul>
      )}

      <WordDetailModal
        word={selected}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
