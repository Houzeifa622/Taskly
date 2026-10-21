"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db, type Category } from "@/lib/db";

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await db.categories.toArray();
        all.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(all);
      } catch (e) {
        setError("Impossible de charger les catégories.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await db.categories.add({
        name: name.trim(),
        color,
        createdAt: new Date(),
      });
      setName("");
      setColor("#3b82f6");
      load();
    } catch (e) {
      setError("Impossible d'ajouter la catégorie.");
      console.error(e);
    }
  }

  async function deleteCategory(id: number) {
    if (!window.confirm("Supprimer cette catégorie et tous ses mots ?")) return;
    try {
      await db.words.where("categoryId").equals(id).delete();
      await db.categories.delete(id);
      load();
    } catch (e) {
      setError("Impossible de supprimer la catégorie.");
      console.error(e);
    }
  }

  if (loading) {
    return <div className="min-h-[300px] flex items-center justify-center text-muted-opacity">Chargement...</div>;
  }

  return (
    <section className="py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold">Mes catégories d'apprentissage</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={addCategory} className="mb-8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nouvelle catégorie (ex: Anglais, Français…)"
            className="flex-1 px-4 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            required
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-none bg-transparent p-1"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Ajouter
          </button>
        </form>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucune catégorie pour le moment. Créez-en une pour commencer à noter
            vos mots et phrases.
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between px-4 py-3 rounded border border-border hover:bg-primary/5 transition-colors dark:hover:bg-primary/10"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <Link href={`/categories/${category.id}`}>
                    <span className="font-medium text-foreground">{category.name}</span>
                  </Link>
                </div>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="text-red-600 hover:text-red-500 text-sm"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}