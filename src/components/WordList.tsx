"use client";

import { useMemo, useState } from "react";
import { db, type WordEntry } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { SearchIcon, PlusIcon, PencilIcon } from "@/components/icons";
import EmptyState from "@/components/EmptyState";
import WordItem from "@/components/WordItem";
import WordDetailModal from "@/components/WordDetailModal";
import WordEntryModal from "@/components/WordEntryModal";
import {
  EmptyNotebookIllustration,
  EmptySearchIllustration,
} from "@/components/illustrations";
import { toastWithUndo } from "@/lib/undo";
import { matchesWordQuery, sortWords, type WordSort } from "@/lib/words";
import { toastSuccess } from "@/lib/toast";

interface Props {
  categoryId: number;
  categoryName: string;
}

export default function WordList({ categoryId, categoryName }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WordEntry | null>(null);
  const [editing, setEditing] = useState<WordEntry | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sort, setSort] = useState<WordSort>("recent");
  const [filter, setFilter] = useState<"all" | "favorites" | "learned" | "tolearn">("all");

  const { data: rawWords, loading } = useLiveQuery<WordEntry[]>(
    () => db.words.where("categoryId").equals(categoryId).toArray(),
    [categoryId]
  );

  const words = useMemo(() => {
    const list = rawWords ?? [];
    let filtered = list;
    
    if (filter === "favorites") {
      filtered = filtered.filter((w) => w.favorite);
    } else if (filter === "learned") {
      filtered = filtered.filter((w) => w.learned);
    } else if (filter === "tolearn") {
      filtered = filtered.filter((w) => !w.learned);
    }
    
    return sortWords(filtered, sort);
  }, [rawWords, sort, filter]);

  const filtered = useMemo(() => {
    return words.filter((word) => matchesWordQuery(word, search));
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
            pronunciation: snapshot.pronunciation,
            synonyms: snapshot.synonyms,
            antonyms: snapshot.antonyms,
            favorite: snapshot.favorite,
            learned: snapshot.learned,
            reviewCount: snapshot.reviewCount ?? 0,
            lastReviewedAt: snapshot.lastReviewedAt ?? null,
            createdAt: snapshot.createdAt,
            updatedAt: snapshot.updatedAt,
          });
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleFavorite(word: WordEntry) {
    if (word.id === undefined) return;
    await db.words.update(word.id, { favorite: !word.favorite, updatedAt: new Date() });
    toastSuccess(word.favorite ? "Retiré des favoris" : "Ajouté aux favoris", word.term);
  }

  async function toggleLearned(word: WordEntry) {
    if (word.id === undefined) return;
    await db.words.update(word.id, { learned: !word.learned, updatedAt: new Date() });
    toastSuccess(word.learned ? "Marqué à réviser" : "Marqué comme appris", word.term);
  }

  async function markReviewed(word: WordEntry) {
    if (word.id === undefined) return;
    await db.words.update(word.id, {
      reviewCount: (word.reviewCount ?? 0) + 1,
      lastReviewedAt: new Date(),
      updatedAt: new Date(),
    });
    toastSuccess("Révision enregistrée", word.term);
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-subheading font-semibold text-foreground">
              {categoryName}
            </h2>
            <p className="text-caption text-muted-foreground">
              {filtered.length} / {words.length} {words.length > 1 ? "entrées" : "entrée"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <PlusIcon className="h-4 w-4" />
            Ajouter un mot
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-opacity" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (terme, définition, exemple...)"
              aria-label="Rechercher dans cette catégorie"
              className="w-full rounded-xl border border-border bg-background py-2 pr-4 pl-10 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as WordSort)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-body text-foreground"
          >
            <option value="recent">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="alpha-asc">A → Z</option>
            <option value="alpha-desc">Z → A</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-body text-foreground"
          >
            <option value="all">Tous</option>
            <option value="favorites">Favoris</option>
            <option value="learned">Appris</option>
            <option value="tolearn">À réviser</option>
          </select>
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
              onEdit={setEditing}
              onDelete={deleteWord}
              onToggleFavorite={toggleFavorite}
              onToggleLearned={toggleLearned}
              onMarkReviewed={markReviewed}
              searchQuery={search}
            />
          ))}
        </ul>
      )}

      <WordDetailModal
        word={selected}
        onClose={() => setSelected(null)}
        onEdit={(w) => {
          setSelected(null);
          setEditing(w);
        }}
      />

      {showAdd && (
        <WordEntryModal
          categoryId={categoryId}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editing && (
        <WordEntryModal
          word={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
