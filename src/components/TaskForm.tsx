"use client";

import { useState } from "react";
import { db, type Task } from "@/lib/db";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Faible" },
  { value: "normal", label: "Normale" },
  { value: "high", label: "Importante" },
];

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Aucune" },
  { value: "daily", label: "Quotidienne" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuelle" },
];

export default function TaskForm() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const now = new Date();
      await db.tasks.add({
        title: title.trim(),
        note: note.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        completed: false,
        priority,
        recurrence,
        createdAt: now,
        updatedAt: now,
      });
      setTitle("");
      setNote("");
      setDueDate("");
      setPriority("normal");
      setRecurrence("none");
    } catch (e) {
      setError("Impossible d'ajouter la tâche.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Nouvelle tâche</h2>
          {error && (
            <div className="mb-3 p-3 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={addTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titre *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Récupérer les documents, implémenter la fonction X…"
                className="w-full px-3 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Note (optionnel)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Détails ou précision…"
                  className="w-full px-3 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date prévue (optionnel)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Priorité</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "normal" | "high")}
                  className="w-full px-3 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Récurrence</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as "none" | "daily" | "weekly" | "monthly")}
                  className="w-full px-3 py-2 rounded border border-border placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {recurrence !== "none" && (
                  <p className="mt-1 text-xs text-muted-opacity">
                    L'événement se renouvellera automatiquement.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-2.5 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            >
              Ajouter la tâche
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}