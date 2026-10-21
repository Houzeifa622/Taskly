"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

/**
 * Observe une requete Dexie et re-rend le composant a chaque modification
 * de la base (ajout, edition, suppression).
 *
 * L'application n'a pas de backend : toutes les donnees vivent dans
 * IndexedDB. `liveQuery` permet d'ecrire directement dans Dexie depuis
 * n'importe quel formulaire et de voir le resultat apparaitre partout
 * sans propager de callbacks entre composants.
 */
export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  deps: readonly unknown[] = []
): { data: T | undefined; error: Error | null; loading: boolean } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const subscription = liveQuery(querier).subscribe({
      next: (result) => {
        if (!active) return;
        setData(result);
        setError(null);
        setLoading(false);
      },
      error: (err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      },
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}
