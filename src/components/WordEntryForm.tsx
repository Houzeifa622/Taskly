"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { PlusIcon } from "@/components/icons";

interface Props {
  categoryId: number;
}

const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

export default function WordEntryForm({ categoryId }: Props) {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [usage, setUsage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;

    setSaving(true);
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
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter le mot ou la phrase.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={addWord}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-base font-semibold text-foreground">
        Ajouter un mot ou une phrase
      </h2>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="word-term" className="mb-1.5 block text-sm font-medium text-foreground">
            Mot ou phrase
          </label>
          <input
            id="word-term"
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Ex: serendipity, faire la queue…"
            className={FIELD_CLASS}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="word-definition"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Signification
            </label>
            <textarea
              id="word-definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={3}
              placeholder="Définition courte…"
              className={`${FIELD_CLASS} resize-y`}
            />
          </div>

          <div>
            <label
              htmlFor="word-usage"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Comment l&apos;utiliser
            </label>
            <textarea
              id="word-usage"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              rows={3}
              placeholder="Exemple de phrase ou contexte…"
              className={`${FIELD_CLASS} resize-y`}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-opacity">
          Cliquez ensuite sur un mot enregistré pour le relire.
        </p>
        <button
          type="submit"
          disabled={saving || !term.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          Enregistrer
        </button>
      </div>
    </form>
  );
}
