"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * true une fois le composant monté dans le navigateur.
 * Permet d'afficher ce qui dépend du navigateur sans casser l'hydratation.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
