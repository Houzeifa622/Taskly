"use client";

import { useMemo, useState } from "react";
import { db, type Category, type WordEntry } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { PlusIcon, SearchIcon } from "@/components/icons";
import CategoryItem from "@/components/CategoryItem";
import CollapsibleForm from "@/components/CollapsibleForm";
import EmptyState from "@/components/EmptyState";
import BackToTop from "@/components/BackToTop";
import { EmptyNotebookIllustration, EmptySearchIllustration } from "@/components/illustrations";
import { useOpenFormSignal } from "@/lib/openForm";
import { toastError, toastSuccess } from "@/lib/toast";
import { toastWithUndo } from "@/lib/undo";
import { matchesWordQuery } from "@/lib/words";
import WordDetailModal from "@/components/WordDetailModal";
import WordEntryModal from "@/components/WordEntryModal";
import Link from "next/link";

const PALETTE = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Émeraude", value: "#10b981" },
  { name: "Ambre", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Ciel", value: "#0ea5e9" },
  { name: "Violet", value: "#a855f7" },
];

export default function CategoryList() {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);
  const [editingWord, setEditingWord] = useState<WordEntry | null>(null);
  // Ouverture automatique lorsqu'il fait suite à un clic sur « + » (PWA).
  const signal = useOpenFormSignal("word");

  const { data: rawCategories, loading } = useLiveQuery<Category[]>(
    () => db.categories.toArray(),
    []
  );
  const { data: words } = useLiveQuery<WordEntry[]>(
    () => db.words.toArray(),
    []
  );

  const categories = useMemo(() => {
    const list = rawCategories ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [rawCategories]);

  const counts = useMemo(() => {
    const map = new Map<number, number>();
    for (const word of words ?? []) {
      map.set(word.categoryId, (map.get(word.categoryId) ?? 0) + 1);
    }
    return map;
  }, [words]);

  const stats = useMemo(() => {
    const allWords = words ?? [];
    const favorites = allWords.filter((w) => w.favorite).length;
    const learned = allWords.filter((w) => w.learned).length;
    const toLearn = allWords.filter((w) => !w.learned).length;
    return { total: allWords.length, favorites, learned, toLearn };
  }, [words]);

  const globalResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const allWords = words ?? [];
    return allWords
      .filter((w) => matchesWordQuery(w, globalSearch))
      .slice(0, 20);
  }, [words, globalSearch]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await db.categories.add({
        name: name.trim(),
        color,
        createdAt: new Date(),
      });
      toastSuccess("Catégorie créée", name.trim());
      setName("");
      setColor(PALETTE[0].value);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter la catégorie.");
      toastError("Impossible d'ajouter la catégorie");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: Category) {
    const id = category.id;
    if (id === undefined) return;

    const snapshot = { ...category };
    const children = (words ?? [])
      .filter((word) => word.categoryId === id)
      .map((word) => ({ ...word }));

    try {
      await db.words.where("categoryId").equals(id).delete();
      await db.categories.delete(id);

      toastWithUndo({
        title: "Catégorie supprimée",
        description: `${snapshot.name} · ${children.length} ${
          children.length > 1 ? "entrées" : "entrée"
        }`,
        onUndo: async () => {
          const newId = await db.categories.add({
            name: snapshot.name,
            color: snapshot.color,
            createdAt: snapshot.createdAt,
          });

          if (children.length > 0) {
            await db.words.bulkAdd(
              children.map((word) => ({
                term: word.term,
                categoryId: newId,
                definition: word.definition,
                usage: word.usage,
                pronunciation: word.pronunciation,
                synonyms: word.synonyms,
                antonyms: word.antonyms,
                favorite: word.favorite,
                learned: word.learned,
                reviewCount: word.reviewCount ?? 0,
                lastReviewedAt: word.lastReviewedAt ?? null,
                createdAt: word.createdAt,
                updatedAt: word.updatedAt,
              }))
            );
          }
        },
      });
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer la catégorie.");
      toastError("Impossible de supprimer la catégorie");
    }
  }

  function exportData() {
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        categories: rawCategories ?? [],
        words: words ?? [],
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taskly-carnet-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toastSuccess("Export réussi", "Fichier JSON téléchargé");
    } catch (err) {
      console.error(err);
      toastError("Erreur lors de l'export");
    }
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data.categories) || !Array.isArray(data.words)) {
        throw new Error("Format invalide");
      }

      // Import categories
      for (const cat of data.categories) {
        const exists = await db.categories.where('name').equals(cat.name).first();
        if (!exists) {
          await db.categories.add({
            name: cat.name,
            color: cat.color,
            createdAt: new Date(cat.createdAt),
          });
        }
      }

      // Refresh categories to get new IDs
      const allCats = await db.categories.toArray();
      const catMap = new Map(allCats.map(c => [c.name, c.id]));

      // Import words
      for (const word of data.words) {
        const catId = catMap.get(word.categoryName) || word.categoryId;
        if (!catId) continue;
        await db.words.add({
          term: word.term,
          categoryId: catId,
          definition: word.definition,
          usage: word.usage,
          pronunciation: word.pronunciation,
          synonyms: word.synonyms,
          antonyms: word.antonyms,
          favorite: word.favorite || false,
          learned: word.learned || false,
          reviewCount: word.reviewCount || 0,
          lastReviewedAt: word.lastReviewedAt ? new Date(word.lastReviewedAt) : null,
          createdAt: new Date(word.createdAt),
          updatedAt: new Date(word.updatedAt || word.createdAt),
        });
      }

      toastSuccess("Import réussi", `${data.words.length} entrée(s) importée(s)`);
      e.target.value = '';
    } catch (err) {
      console.error(err);
      toastError("Erreur lors de l'import", "Vérifiez le format du fichier");
      e.target.value = '';
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-title font-bold tracking-tight text-foreground">
              Mon carnet
            </h1>
            <p className="mt-2 text-body text-muted-foreground">
              Créez une catégorie par thème, puis ajoutez-y vos mots et phrases.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportData}
              className="rounded-lg border border-border px-3 py-1.5 text-caption font-medium text-foreground hover:bg-muted"
            >
              Exporter
            </button>
            <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-caption font-medium text-foreground hover:bg-muted">
              Importer
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>
        {stats.total > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 text-caption text-muted-foreground">
            <span>{stats.total} entrée{stats.total > 1 ? "s" : ""}</span>
            <span>•</span>
            <span>{stats.favorites} favori{stats.favorites > 1 ? "s" : ""}</span>
            <span>•</span>
            <span>{stats.learned} appris</span>
            <span>•</span>
            <span>{stats.toLearn} à réviser</span>
          </div>
        )}
      </header>

      {stats.total > 0 && (
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-opacity" />
            <input
              type="search"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Recherche globale dans tout le carnet..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pr-4 pl-10 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none"
            />
          </div>
          {globalSearch.trim() && (
            <div className="mt-3 rounded-xl border border-border bg-card shadow-sm">
              {globalResults.length === 0 ? (
                <div className="p-4 text-center text-body text-muted-foreground">
                  Aucun résultat
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {globalResults.map((word) => {
                    const cat = categories.find(c => c.id === word.categoryId);
                    return (
                      <li key={word.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedWord(word)}
                          className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat?.color ?? "#6366f1" }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">{word.term}</p>
                            {word.definition && (
                              <p className="text-caption text-muted-foreground truncate">{word.definition}</p>
                            )}
                          </div>
                          <span className="text-caption text-muted-opacity">{cat?.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <CollapsibleForm
        key={signal}
        defaultOpen={signal > 0}
        title="Nouvelle catégorie"
        subtitle="Un thème pour regrouper vos mots et phrases"
        icon={<PlusIcon className="h-4.5 w-4.5" />}
      >
        <form onSubmit={addCategory}>
          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-body text-danger">
              {error}
            </div>
          )}

          <label
            htmlFor="category-name"
            className="block text-label font-medium text-foreground"
          >
            Nom de la catégorie
          </label>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Anglais, Français, Maths…"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-caption font-medium text-muted-foreground">
              Couleur :
            </span>
            {PALETTE.map((swatch) => (
              <button
                key={swatch.value}
                type="button"
                onClick={() => setColor(swatch.value)}
                aria-label={swatch.name}
                aria-pressed={color === swatch.value}
                className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                  color === swatch.value
                    ? "ring-2 ring-primary"
                    : "ring-1 ring-border"
                }`}
                style={{ backgroundColor: swatch.value }}
              />
            ))}
          </div>
        </form>
      </CollapsibleForm>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-border bg-card/60"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            illustration={<EmptyNotebookIllustration />}
            title="Aucune catégorie pour le moment"
            description="Commencez par créer une catégorie, puis ajoutez vos mots et phrases à l'intérieur."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {categories.map((category, index) => (
            <CategoryItem
              key={category.id}
              category={category}
              count={category.id ? counts.get(category.id) ?? 0 : 0}
              index={index}
              onDelete={deleteCategory}
            />
          ))}
        </ul>
      )}

      <WordDetailModal
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
        onEdit={(word) => {
          setSelectedWord(null);
          setEditingWord(word);
        }}
      />

      {editingWord && (
        <WordEntryModal
          word={editingWord}
          onClose={() => setEditingWord(null)}
        />
      )}
      <BackToTop />
    </section>
  );
}
