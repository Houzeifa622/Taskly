"use client";

import Link from "next/link";
import Modal from "@/components/Modal";
import WordDetailCard from "@/components/WordDetailCard";
import type { WordEntry } from "@/lib/db";
import { PencilIcon } from "@/components/icons";

interface Props {
  word: WordEntry | null;
  onClose: () => void;
  onEdit?: (word: WordEntry) => void;
}

/**
 * Détail d'une entrée du carnet, affiché en surimpression : on garde le
 * contexte de la liste au lieu de quitter la page.
 */
export default function WordDetailModal({ word, onClose, onEdit }: Props) {
  return (
    <Modal
      open={word !== null}
      onClose={onClose}
      title={word?.term}
      footer={
        word ? (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(word)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2 text-label font-medium text-foreground transition-colors hover:bg-muted"
              >
                <PencilIcon className="h-4 w-4" />
                Modifier
              </button>
            )}
            <Link
              href={`/words/${word.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-primary-soft px-4 py-2 text-label font-medium text-primary transition-colors hover:bg-primary/15 focus:ring-4 focus:ring-primary/20 focus:outline-none"
            >
              Ouvrir la page complète
            </Link>
          </div>
        ) : null
      }
    >
      {word && <WordDetailCard word={word} />}
    </Modal>
  );
}
