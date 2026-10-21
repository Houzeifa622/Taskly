"use client";

import { useEffect, useState } from "react";
import { db, type WordEntry } from "@/lib/db";
import Link from "next/link";

interface Props {
  wordId: number;
}

export default function WordDetail({ wordId }: Props) {
  const [word, setWord] = useState<WordEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWord();
  }, [wordId]);

  async function loadWord() {
    try {
      const w = await db.words.get(wordId);
      if (!w) {
        setError("Mot introuvable.");
        return;
      }
      setWord(w);
    } catch (e) {
      setError("Impossible de charger le mot.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20">Chargement...</div>;
  }

  if (error || !word) {
    return (
      <div className="max-w-md mx-auto py-10 text-center">
        <p className="text-red-600 dark:text-red-400">{error || "Mot introuvable."}</p>
        <Link
          href="/categories"
          className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
        >
          Retour aux catégories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href={`/categories/${word.categoryId}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Retour à la catégorie
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
        <h1 className="text-3xl font-semibold text-foreground mb-2">{word.term}</h1>

        {word.definition && (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Signification
            </h2>
            <p className="text-lg text-gray-800 dark:text-gray-200 italic">
              {word.definition}
            </p>
          </div>
        )}

        {word.usage && (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Comment l'utiliser
            </h2>
            <p className="text-lg text-gray-800 dark:text-gray-200">
              {word.usage}
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <span>Créé le {word.createdAt.toLocaleDateString("fr-FR")}</span>
          <span>Modifié le {word.updatedAt.toLocaleDateString("fr-FR")}</span>
        </div>
      </div>
    </div>
  );
}
