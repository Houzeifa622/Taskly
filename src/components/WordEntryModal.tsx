"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { db, type WordEntry } from "@/lib/db";
import { toastError, toastSuccess } from "@/lib/toast";
import { PlusIcon, PencilIcon } from "@/components/icons";

const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-body text-foreground placeholder:text-muted-opacity transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

const LABEL_CLASS = "mb-1.5 block text-label font-medium text-foreground";

interface Props {
  categoryId?: number;
  word?: WordEntry | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function WordEntryModal({ categoryId, word, onClose, onSaved }: Props) {
  const isEdit = Boolean(word?.id);
  const [term, setTerm] = useState(word?.term ?? "");
  const [definition, setDefinition] = useState(word?.definition ?? "");
  const [usage, setUsage] = useState(word?.usage ?? "");
  const [pronunciation, setPronunciation] = useState(word?.pronunciation ?? "");
  const [synonyms, setSynonyms] = useState(word?.synonyms ?? "");
  const [antonyms, setAntonyms] = useState(word?.antonyms ?? "");
  const [favorite, setFavorite] = useState(word?.favorite ?? false);
  const [learned, setLearned] = useState(word?.learned ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;

    const targetCategoryId = word?.categoryId ?? categoryId;
    if (!targetCategoryId) return;

    setSaving(true);
    setError(null);

    try {
      const now = new Date();
      if (isEdit && word?.id) {
        await db.words.update(word.id, {
          term: term.trim(),
          definition: definition.trim() || undefined,
          usage: usage.trim() || undefined,
          pronunciation: pronunciation.trim() || undefined,
          synonyms: synonyms.trim() || undefined,
          antonyms: antonyms.trim() || undefined,
          favorite,
          learned,
          updatedAt: now,
        });
        toastSuccess("Entrée modifiée", term.trim());
      } else {
        await db.words.add({
          term: term.trim(),
          categoryId: targetCategoryId,
          definition: definition.trim() || undefined,
          usage: usage.trim() || undefined,
          pronunciation: pronunciation.trim() || undefined,
          synonyms: synonyms.trim() || undefined,
          antonyms: antonyms.trim() || undefined,
          favorite,
          learned,
          reviewCount: 0,
          lastReviewedAt: null,
          createdAt: now,
          updatedAt: now,
        });
        toastSuccess("Entrée enregistrée", term.trim());
      }
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Impossible d'enregistrer l'entrée.");
      toastError("Impossible d'enregistrer l'entrée");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Modifier l'entrée" : "Ajouter un mot ou une phrase"}
      description="Consignez-le, vous le retrouverez en un clic"
    >
      <form onSubmit={save} className="mt-4 space-y-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-body text-danger">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="word-term" className={LABEL_CLASS}>
            Mot ou phrase *
          </label>
          <input
            id="word-term"
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Ex: serendipity, faire la queue…"
            className={FIELD_CLASS}
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="word-pronunciation" className={LABEL_CLASS}>
            Prononciation (facultatif)
          </label>
          <input
            id="word-pronunciation"
            type="text"
            value={pronunciation}
            onChange={(e) => setPronunciation(e.target.value)}
            placeholder="Ex: /sɛ.ʁɑ̃.di.pi.ti/ ou se-ren-dip-i-ty"
            className={FIELD_CLASS}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="word-definition" className={LABEL_CLASS}>
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
            <label htmlFor="word-usage" className={LABEL_CLASS}>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="word-synonyms" className={LABEL_CLASS}>
              Synonymes (facultatif)
            </label>
            <input
              id="word-synonyms"
              type="text"
              value={synonyms}
              onChange={(e) => setSynonyms(e.target.value)}
              placeholder="Séparés par des virgules"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label htmlFor="word-antonyms" className={LABEL_CLASS}>
              Antonymes (facultatif)
            </label>
            <input
              id="word-antonyms"
              type="text"
              value={antonyms}
              onChange={(e) => setAntonyms(e.target.value)}
              placeholder="Séparés par des virgules"
              className={FIELD_CLASS}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-body text-foreground">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Favori
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-body text-foreground">
            <input
              type="checkbox"
              checked={learned}
              onChange={(e) => setLearned(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Appris
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-body font-medium text-foreground transition-colors hover:bg-muted"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || !term.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            {isEdit ? <PencilIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {isEdit ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
