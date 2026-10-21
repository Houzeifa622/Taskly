"use client";

import { useState, useEffect } from "react";
import { db, type Category, type ScheduleEvent } from "@/lib/db";

export default function ScheduleForm() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
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
        setLoadingCategories(false);
      }
    }
    load();
  }, []);

  async function addSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const start = startTime ? new Date(startTime) : new Date();
      const end = endTime ? new Date(endTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

      await db.scheduleEvents.add({
        title: title.trim(),
        note: note.trim() || undefined,
        startDateTime: start,
        endDateTime: end,
        categoryId: categoryId || null,
        recurrence,
        createdAt: new Date(),
      });

      setTitle("");
      setNote("");
      setStartTime("");
      setEndTime("");
      setRecurrence("none");
      setCategoryId(undefined);
    } catch (e) {
      setError("Impossible d'ajouter l'événement.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loadingCategories) {
    return <div className="min-h-[300px] flex items-center justify-center text-muted-opacity">Chargement des catégories…</div>;
  }

  return (
    <section className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Nouvel événement</h2>
          {error && (
            <div className="mb-3 p-3 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={addSchedule} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titre *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Réunion équipe, temps de développement…"
                className="w-full px-3 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Début</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fin</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                disabled={categories.length === 0}
              >
                <option value="">Aucune catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="mt-1 text-xs text-muted-opacity">
                  Aucune catégorie pour le moment. Créez-en une depuis la page
                  "Catégories".
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Récurrence</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as "none" | "daily" | "weekly" | "monthly")}
                className="w-full px-3 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="none">Aucune</option>
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
              {recurrence !== "none" && (
                <p className="mt-1 text-xs text-muted-opacity">
                  L'événement se répétera automatiquement.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-2.5 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            >
              Ajouter à l'emploi du temps
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}