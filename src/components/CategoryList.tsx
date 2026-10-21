"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { db, type Category } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { ArrowRightIcon, PlusIcon, TrashIcon } from "@/components/icons";

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

  const { data: rawCategories, loading } = useLiveQuery<Category[]>(
    () => db.categories.toArray(),
    []
  );
  const { data: words } = useLiveQuery(() => db.words.toArray(), []);

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
      setName("");
      setColor(PALETTE[0].value);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter la catégorie.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: Category) {
    const id = category.id;
    if (id === undefined) return;
    if (!window.confirm(`Supprimer « ${category.name} » et tous ses mots ?`))
      return;

    try {
      await db.words.where("categoryId").equals(id).delete();
      await db.categories.delete(id);
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer la catégorie.");
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Mon carnet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Créez une catégorie par thème, puis ajoutez-y vos mots et phrases.
        </p>
      </header>

      <form
        onSubmit={addCategory}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <label
          htmlFor="category-name"
          className="block text-sm font-medium text-foreground"
        >
          Nouvelle catégorie
        </label>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Anglais, Français, Maths…"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
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
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">
            Aucune catégorie pour le moment
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Commencez par créer une catégorie, puis ajoutez vos mots et phrases
            à l&apos;intérieur.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {categories.map((category) => {
            const count = category.id ? counts.get(category.id) ?? 0 : 0;

            return (
              <li
                key={category.id}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/40 hover:bg-card-hover"
              >
                <span
                  className="h-9 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color ?? "#6366f1" }}
                />

                <Link
                  href={`/categories/${category.id}`}
                  className="min-w-0 flex-1 rounded-lg outline-none"
                >
                  <span className="block truncate font-medium text-foreground">
                    {category.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {count} {count > 1 ? "mots ou phrases" : "mot ou phrase"}
                  </span>
                </Link>

                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/categories/${category.id}`}
                    className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-muted hover:text-primary"
                    aria-label={`Ouvrir ${category.name}`}
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-danger-soft hover:text-danger"
                    aria-label={`Supprimer ${category.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
