"use client";

import { toast, toastSuccess } from "@/lib/toast";

interface UndoOptions {
  title: string;
  description?: string;
  onUndo: () => void | Promise<void>;
}

/**
 * Affiche une notification avec une action d'annulation : l'action peut
 * être rattrapée pendant quelques secondes.
 */
export function toastWithUndo({
  title,
  description,
  onUndo,
}: UndoOptions) {
  toast({
    title,
    description,
    duration: 8000,
    action: {
      label: "Annuler",
      onClick: () => {
        void Promise.resolve(onUndo()).then(() =>
          toastSuccess("Action annulée", description)
        );
      },
    },
  });
}
