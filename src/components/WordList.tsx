"use client";

import { useEffect, useState } from "react";
import { db, type WordEntry } from "@/lib/db";
import Link from "next/link";

interface Props {
  categoryId: number;
  categoryName: string;
}

export default function WordList({ categoryId, categoryName }: Props) {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWords();
  }, [categoryId]);

  async function loadWords() {
    try {
      const all = await db.words.where("categoryId").equals(categoryId).toArray();
      all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setWords(all);
    } catch (e) {
      setError("Impossible de charger les mots.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function deleteWord(id: number | undefined) {
    if (!id) return;
    if (!window.confirm("Supprimer ce mot ?")) return;
    try {
      await db.words.delete(id);
      await loadWords();
    } catch (e) {
      setError("Impossible de supprimer le mot.");
      console.error(e);
    }
  }

  if (loading) {
    return <div className="text-center py-20">Chargement...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{categoryName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {words.length} mot(s) ou phrase(s)
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {words.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Aucun mot ou phrase enregistré dans cette catégorie pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {words.map((word) => (
            <div
              key={word.id}
              className="flex items-center justify-between px-4 py-3 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white hover:bg-gray-700/50"
            >
              <div className="flex-1">
                <Link
                  href={`/words/${word.id}`}
                  className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {word.term}
                </Link>
                {word.definition && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {word.definition}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteWord(word.id);
                }}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
