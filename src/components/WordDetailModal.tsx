"use client";

import Link from "next/link";
import Modal from "@/components/Modal";
import WordDetailCard from "@/components/WordDetailCard";
import type { WordEntry } from "@/lib/db";

interface Props {
  word: WordEntry | null;
  onClose: () => void;
}

/**
 * Détail d'une entrée du carnet, affiché en surimpression : on garde le
 * contexte de la liste au lieu de quitter la page.
 */
export default function WordDetailModal({ word, onClose }: Props) {
  return (
    <Modal
      open={word !== null}
      onClose={onClose}
      title={word?.term}
      footer={
        word ? (
          <Link
            href={`/words/${word.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-primary-soft px-4 py-2 text-label font-medium text-primary transition-colors hover:bg-primary/15 focus:ring-4 focus:ring-primary/20 focus:outline-none"
          >
            Ouvrir la page complète
          </Link>
        ) : null
      }
    >
      {word && <WordDetailCard word={word} />}
    </Modal>
  );
}
