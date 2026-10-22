"use client";

import { useEffect, useState } from "react";

export type FormKind = "task" | "word" | "event";

interface OpenRequest {
  kind: FormKind;
  nonce: number;
}

let pending: OpenRequest | null = null;
let nonce = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Demande l'ouverture d'un formulaire (bouton d'ajout rapide de la PWA). */
export function requestOpenForm(kind: FormKind) {
  nonce += 1;
  pending = { kind, nonce };
  emit();
}

export function subscribeOpenForm(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPendingOpenForm(): OpenRequest | null {
  return pending;
}

/** Marque la demande comme traitée afin qu'elle ne soit rejouée qu'une fois. */
export function consumeOpenForm(kind: FormKind, requestNonce: number) {
  if (pending && pending.kind === kind && pending.nonce === requestNonce) {
    pending = null;
  }
}

/**
 * Retourne un compteur incrémenté à chaque demande d'ouverture du
 * formulaire correspondant. Le compteur sert de clé de remontage : le
 * formulaire s'ouvre (et se réinitialise) à chaque demande.
 */
export function useOpenFormSignal(kind: FormKind): number {
  const [signal, setSignal] = useState(0);

  useEffect(() => {
    const check = () => {
      const request = getPendingOpenForm();
      if (request && request.kind === kind) {
        consumeOpenForm(kind, request.nonce);
        setSignal((value) => value + 1);
      }
    };

    // La demande a pu être émise avant le montage du formulaire.
    const timer = window.setTimeout(check, 0);
    const unsubscribe = subscribeOpenForm(check);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [kind]);

  return signal;
}
