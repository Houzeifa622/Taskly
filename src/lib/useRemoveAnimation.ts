"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Déclenche une animation de sortie (fondu + réduction) avant de jouer
 * l'action de suppression réelle.
 */
export function useRemoveAnimation(duration = 180) {
  const [removing, setRemoving] = useState(false);
  const busy = useRef(false);

  const remove = useCallback(
    async (action: () => void | Promise<void>) => {
      if (busy.current) return;
      busy.current = true;
      setRemoving(true);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, duration);
      });

      try {
        await action();
      } finally {
        busy.current = false;
      }
    },
    [duration]
  );

  return { removing, remove };
}
