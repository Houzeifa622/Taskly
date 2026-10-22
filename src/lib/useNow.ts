"use client";

import { useEffect, useState } from "react";

/**
 * Horloge réactive : renvoie l'instant courant et se rafraîchit à intervalle
 * régulier (utile pour la ligne « maintenant » de la vue journée).
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
