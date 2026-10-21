"use client";

import { useState } from "react";
import { db, type WordEntry } from "@/lib/db";
import Link from "next/link";

interface Props {
  categoryId: number;
}

export default function WordEntryForm({ categoryId }: Props) {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [usage, setUsage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      await db.words.add({
        term: term.trim(),
        categoryId,
        definition: definition.trim() || undefined,
        usage: usage.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      });
      setTerm("");
      setDefinition("");
      setUsage("");
      // Pas de callback parent - la liste se rafraîchira au prochain rendu
    } catch (e) {
      setError("Impossible d'ajouter le mot ou la phrase.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 p-5 rounded border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Ajouter un mot ou une phrase</h2>
      {error && (
        <div className="mb-3 p-2 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={addWord} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mot ou phrase
          </label>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Ex: serendipity, faire la queue…"
            className="mt-1 block w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Signification (optionnel)
          </label>
          <textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            rows={2}
            placeholder="Définition courte…"
            className="mt-1 block w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Comment l'utiliser (optionnel)
          </label>
          <textarea
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            rows={2}
            placeholder="Exemple de phrase ou contexte…"
            className="mt-1 block w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Enregistrer
        </button>
      </form>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Vous pouvez cliquer sur n'importe quel mot enregistré pour voir sa
        signification et comment l'utiliser.
      </p>
      <Link
        href="/categories"
        className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        ← Retour aux catégories
      </Link>
    </div>
  );
}
