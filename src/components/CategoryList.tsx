"use client";

import { useMemo, useState } from "react";
import { db, type Category, type WordEntry } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { PlusIcon } from "@/components/icons";
import CategoryItem from "@/components/CategoryItem";
import CollapsibleForm from "@/components/CollapsibleForm";
import EmptyState from "@/components/EmptyState";
import { EmptyNotebookIllustration } from "@/components/illustrations";
import { useOpenFormSignal } from "@/lib/openForm";
import { toastError, toastSuccess } from "@/lib/toast";
import { toastWithUndo } from "@/lib/undo";

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

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-title font-bold tracking-tight text-foreground">
          Mon carnet
        </h1>
        <p className="mt-2 text-body text-muted-foreground">
          Créez une catégorie par thème, puis ajoutez-y vos mots et phrases.
        </p>
      </header>

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
    </section>
  );
}
